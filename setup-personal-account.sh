#!/bin/bash

# Script para configurar cuenta personal AWS
# Ejecutar: bash setup-personal-account.sh

set -e

echo "🚀 Configuración de Cuenta Personal AWS - SmartBoxing"
echo "======================================================"
echo ""

# Colores
GREEN='\033[0[32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar si AWS CLI está instalado
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI no está instalado${NC}"
    echo "Instalar desde: https://aws.amazon.com/cli/"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI encontrado${NC}"
echo ""

# Paso 1: Configurar credenciales
echo "📝 Paso 1: Configurar Credenciales"
echo "=================================="
echo ""
echo "Ve a AWS Console (cuenta 624991056069):"
echo "  IAM → Users → Security credentials → Create access key"
echo ""
read -p "¿Ya tienes las credenciales? (y/n): " has_creds

if [ "$has_creds" != "y" ]; then
    echo -e "${YELLOW}⚠️  Obtén las credenciales primero y vuelve a ejecutar este script${NC}"
    exit 0
fi

echo ""
echo "Configurando perfil 'personal'..."
aws configure --profile personal

# Verificar cuenta
echo ""
echo "Verificando cuenta..."
ACCOUNT_ID=$(aws sts get-caller-identity --profile personal --query Account --output text)

if [ "$ACCOUNT_ID" != "624991056069" ]; then
    echo -e "${RED}❌ Cuenta incorrecta: $ACCOUNT_ID${NC}"
    echo -e "${YELLOW}   Esperaba: 624991056069${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Cuenta correcta: $ACCOUNT_ID${NC}"

# Paso 2: Crear role de Lambda
echo ""
echo "📝 Paso 2: Crear IAM Role para Lambda"
echo "====================================="
echo ""

# Verificar si el role ya existe
if aws iam get-role --role-name SmartBoxingLambdaRole --profile personal &> /dev/null; then
    echo -e "${YELLOW}⚠️  Role SmartBoxingLambdaRole ya existe${NC}"
    read -p "¿Quieres recrearlo? (y/n): " recreate
    if [ "$recreate" == "y" ]; then
        echo "Eliminando políticas adjuntas..."
        aws iam detach-role-policy --role-name SmartBoxingLambdaRole --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole --profile personal 2>/dev/null || true
        aws iam detach-role-policy --role-name SmartBoxingLambdaRole --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess --profile personal 2>/dev/null || true
        echo "Eliminando role..."
        aws iam delete-role --role-name SmartBoxingLambdaRole --profile personal
    else
        echo "Manteniendo role existente"
        ROLE_ARN=$(aws iam get-role --role-name SmartBoxingLambdaRole --profile personal --query Role.Arn --output text)
        echo -e "${GREEN}✅ Role ARN: $ROLE_ARN${NC}"
        goto step3
    fi
fi

# Crear trust policy
echo "Creando trust policy..."
cat > /tmp/lambda-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Crear role
echo "Creando role SmartBoxingLambdaRole..."
aws iam create-role \
  --role-name SmartBoxingLambdaRole \
  --assume-role-policy-document file:///tmp/lambda-trust-policy.json \
  --description "Role para funciones Lambda de SmartBoxing" \
  --profile personal

echo "Adjuntando políticas..."
aws iam attach-role-policy \
  --role-name SmartBoxingLambdaRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
  --profile personal

aws iam attach-role-policy \
  --role-name SmartBoxingLambdaRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess \
  --profile personal

ROLE_ARN="arn:aws:iam::624991056069:role/SmartBoxingLambdaRole"
echo -e "${GREEN}✅ Role creado: $ROLE_ARN${NC}"

# Paso 3: Configurar variables de entorno
step3:
echo ""
echo "📝 Paso 3: Configurar Variables de Entorno"
echo "=========================================="
echo ""

# Crear .env
cat > .env << EOF
AWS_REGION=us-east-1
AWS_LAMBDA_ROLE=$ROLE_ARN
STAGE=dev
EOF

echo -e "${GREEN}✅ Archivo .env creado${NC}"

# Paso 4: Configurar GitHub Secrets
echo ""
echo "📝 Paso 4: Actualizar GitHub Secrets"
echo "===================================="
echo ""
echo "Ve a: https://github.com/MattiasMR/smartboxing/settings/secrets/actions"
echo ""
echo "Actualiza estos secrets:"
echo "  1. AWS_ACCESS_KEY_ID = (tu access key de cuenta personal)"
echo "  2. AWS_SECRET_ACCESS_KEY = (tu secret key de cuenta personal)"
echo "  3. AWS_LAMBDA_ROLE = $ROLE_ARN"
echo "  4. ELIMINA AWS_SESSION_TOKEN (no se necesita en cuenta personal)"
echo ""
read -p "¿GitHub secrets actualizados? (y/n): " secrets_updated

if [ "$secrets_updated" != "y" ]; then
    echo -e "${YELLOW}⚠️  Actualiza los secrets antes de continuar${NC}"
    exit 0
fi

# Paso 5: Verificar permisos de CloudFront
echo ""
echo "📝 Paso 5: Verificar Permisos de CloudFront"
echo "==========================================="
echo ""

if aws cloudfront list-distributions --profile personal --max-items 1 &> /dev/null; then
    echo -e "${GREEN}✅ Permisos de CloudFront OK${NC}"
else
    echo -e "${RED}❌ Sin permisos de CloudFront${NC}"
    echo ""
    echo "Necesitas agregar permisos de CloudFront a tu usuario IAM"
    echo "En AWS Console → IAM → Users → Tu usuario → Add permissions:"
    echo "  - CloudFrontFullAccess"
    exit 1
fi

# Paso 6: Listo para deploy
echo ""
echo "======================================================"
echo -e "${GREEN}✅ ¡Configuración Completada!${NC}"
echo "======================================================"
echo ""
echo "Siguiente paso: Deploy"
echo ""
echo "  # Establecer perfil AWS"
echo "  export AWS_PROFILE=personal"
echo ""
echo "  # Deploy"
echo "  npm run deploy"
echo ""
echo "⏱️  CloudFront tomará 10-15 minutos en crearse"
echo ""
echo "Después del deploy:"
echo "  1. Copiar CloudFrontUrl de los outputs"
echo "  2. Agregar a Cognito CallbackURLs manualmente"
echo ""

