#!/bin/bash

# 🚀 Script de Deploy Completo - SmartBoxing
# Ejecuta el deploy completo con validaciones

set -e

echo "🚀 DEPLOY SMARTBOXING A PRODUCCIÓN"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Verificar credenciales AWS
echo -e "${BLUE}🔐 Verificando credenciales AWS...${NC}"
if [ -z "$AWS_ACCESS_KEY_ID" ]; then
  echo -e "${RED}❌ AWS_ACCESS_KEY_ID no configurado${NC}"
  echo ""
  echo "Configura tus credenciales AWS:"
  echo "  export AWS_ACCESS_KEY_ID=xxx"
  echo "  export AWS_SECRET_ACCESS_KEY=xxx"
  echo "  export AWS_SESSION_TOKEN=xxx  # Solo AWS Academy"
  exit 1
fi

aws sts get-caller-identity > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Credenciales AWS válidas${NC}"
  aws sts get-caller-identity
else
  echo -e "${RED}❌ Credenciales AWS inválidas${NC}"
  exit 1
fi

echo ""

# 2. Verificar dependencias instaladas
echo -e "${BLUE}📦 Verificando dependencias...${NC}"
if [ ! -d "backend/node_modules" ]; then
  echo "Instalando backend..."
  cd backend && npm install && cd ..
fi
if [ ! -d "frontend/node_modules" ]; then
  echo "Instalando frontend..."
  cd frontend && npm install && cd ..
fi
echo -e "${GREEN}✓ Dependencias instaladas${NC}"
echo ""

# 3. Ejecutar tests
echo -e "${BLUE}🧪 Ejecutando tests...${NC}"
cd backend
npm test > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Backend tests pasando (38 tests)${NC}"
else
  echo -e "${RED}❌ Backend tests fallando${NC}"
  npm test
  exit 1
fi
cd ..

cd frontend
npm test > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Frontend tests pasando (17 tests)${NC}"
else
  echo -e "${RED}❌ Frontend tests fallando${NC}"
  npm test
  exit 1
fi
cd ..

echo ""

# 4. Deploy a AWS
echo -e "${BLUE}🚀 Iniciando deploy a AWS...${NC}"
echo -e "${YELLOW}⏳ Esto puede tomar 5-10 minutos...${NC}"
echo ""

npx serverless deploy --verbose

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ DEPLOY EXITOSO!${NC}"
  echo ""
  
  # 5. Obtener URLs
  echo -e "${BLUE}📋 Información del deployment:${NC}"
  npx serverless info
  
  echo ""
  echo -e "${GREEN}🎉 SIGUIENTE PASO:${NC}"
  echo "1. Abre la CloudFront URL en tu navegador"
  echo "2. Registra un nuevo usuario"
  echo "3. Ve a Settings y configura:"
  echo "   - Logo"
  echo "   - Colores"
  echo "   - Nombre de institución"
  echo "   - Horarios"
  echo "4. Crea un Box, Doctor, Paciente y Cita"
  echo "5. Verifica que las citas respetan los horarios configurados"
  echo ""
  echo "Ver checklist completo: CHECKLIST_DEPLOY.md"
  
else
  echo ""
  echo -e "${RED}❌ DEPLOY FALLÓ${NC}"
  echo ""
  echo "Ver logs de error arriba."
  echo "Para más detalles:"
  echo "  aws cloudformation describe-stack-events --stack-name smartboxing-prod"
  exit 1
fi
