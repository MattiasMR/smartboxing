#!/bin/bash

# 🔍 Script de Validación Rápida - SmartBoxing
# Ejecutar antes del deploy para verificar que todo está OK

set -e  # Exit on error

echo "🔍 VALIDACIÓN PRE-DEPLOY - SMARTBOXING"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

check() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
  fi
}

# 1. Verificar estructura de directorios
echo "📁 Verificando estructura..."
[ -d "backend/src/handlers" ] && check "Backend handlers exist" || check "Backend handlers missing"
[ -d "frontend/src" ] && check "Frontend src exists" || check "Frontend src missing"
[ -f "serverless.yml" ] && check "serverless.yml exists" || check "serverless.yml missing"

# 2. Verificar archivos críticos
echo ""
echo "📄 Verificando archivos críticos..."
[ -f "backend/src/handlers/settings/client-get.js" ] && check "client-get.js" || check "client-get.js MISSING"
[ -f "backend/src/handlers/settings/client-put.js" ] && check "client-put.js" || check "client-put.js MISSING"
[ -f "backend/src/handlers/settings/upload-logo.js" ] && check "upload-logo.js" || check "upload-logo.js MISSING"
[ -f "backend/src/handlers/analytics/dashboard.js" ] && check "dashboard.js" || check "dashboard.js MISSING"
[ -f "frontend/src/pages/SettingsNew.jsx" ] && check "SettingsNew.jsx" || check "SettingsNew.jsx MISSING"
[ -f "frontend/src/components/layout/TopHeader.jsx" ] && check "TopHeader.jsx" || check "TopHeader.jsx MISSING"

# 3. Verificar tests
echo ""
echo "🧪 Verificando tests..."
[ -f "backend/src/handlers/__tests__/security/a01-access-control.test.js" ] && check "OWASP A01 test" || check "OWASP A01 test MISSING"
[ -f "frontend/src/__tests__/accessibility/wcag-compliance.test.jsx" ] && check "WCAG test" || check "WCAG test MISSING"

# 4. Verificar node_modules
echo ""
echo "📦 Verificando dependencias..."
[ -d "backend/node_modules" ] && check "Backend node_modules" || check "Backend node_modules - RUN: cd backend && npm install"
[ -d "frontend/node_modules" ] && check "Frontend node_modules" || check "Frontend node_modules - RUN: cd frontend && npm install"

# 5. Verificar package.json scripts
echo ""
echo "📜 Verificando scripts de test..."
grep -q '"test"' backend/package.json && check "Backend test script" || check "Backend test script MISSING"
grep -q '"test"' frontend/package.json && check "Frontend test script" || check "Frontend test script MISSING"

# 6. Verificar workflows
echo ""
echo "⚙️ Verificando workflows CI/CD..."
[ -f ".github/workflows/deploy.yml" ] && check "Deploy workflow" || check "Deploy workflow MISSING"
[ -f ".github/workflows/security-tests.yml" ] && check "Security workflow" || check "Security workflow MISSING"
[ -f ".github/workflows/accessibility-tests.yml" ] && check "Accessibility workflow" || check "Accessibility workflow MISSING"

# 7. Verificar credenciales AWS (solo check, no bloqueante)
echo ""
echo "🔐 Verificando credenciales AWS..."
if [ -z "$AWS_ACCESS_KEY_ID" ]; then
  echo -e "${YELLOW}⚠${NC} AWS_ACCESS_KEY_ID no configurado"
  echo "   Ejecutar: export AWS_ACCESS_KEY_ID=xxx"
else
  check "AWS_ACCESS_KEY_ID configurado"
fi

if [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
  echo -e "${YELLOW}⚠${NC} AWS_SECRET_ACCESS_KEY no configurado"
  echo "   Ejecutar: export AWS_SECRET_ACCESS_KEY=xxx"
else
  check "AWS_SECRET_ACCESS_KEY configurado"
fi

# 8. Ejecutar tests
echo ""
echo "🧪 Ejecutando tests..."
echo ""
echo "Backend tests:"
cd backend
npm test > /dev/null 2>&1 && check "Backend tests (38 tests)" || check "Backend tests FAILED"
cd ..

echo ""
echo "Frontend tests:"
cd frontend
npm test > /dev/null 2>&1 && check "Frontend tests (17 tests)" || check "Frontend tests FAILED"
cd ..

# Resumen
echo ""
echo "======================================"
echo -e "${GREEN}PASADOS: $PASSED${NC}"
echo -e "${RED}FALLADOS: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ TODO LISTO PARA DEPLOY!${NC}"
  echo ""
  echo "Ejecutar:"
  echo "  sls deploy --verbose"
  exit 0
else
  echo -e "${RED}❌ HAY ERRORES - REVISAR ANTES DE DEPLOY${NC}"
  exit 1
fi
