# ✅ CHECKLIST PRE-DEPLOY - SMARTBOXING

**Fecha:** 17 de Noviembre, 2025  
**Objetivo:** Validar que todo está listo para deploy a producción

---

## 📋 REQUISITOS PREVIOS

### Credenciales AWS
- [ ] `AWS_ACCESS_KEY_ID` configurado
- [ ] `AWS_SECRET_ACCESS_KEY` configurado
- [ ] `AWS_SESSION_TOKEN` configurado (solo AWS Academy)
- [ ] Verificar con: `aws sts get-caller-identity`

### Dependencias Instaladas
- [x] **Root:** `npm install` ✅
- [x] **Backend:** `cd backend && npm install` ✅
- [x] **Frontend:** `cd frontend && npm install` ✅

### Tests Pasando
- [x] **Backend:** 38 tests ✅
  ```bash
  cd backend && npm test
  # ✓ 5 archivos (38 tests)
  ```
- [x] **Frontend:** 17 tests ✅
  ```bash
  cd frontend && npm test
  # ✓ 1 archivo (17 tests accesibilidad)
  ```

---

## 🔧 CONFIGURACIÓN SERVERLESS

### Variables de Entorno (.env)
Verificar que existan:
- [ ] `STAGE=prod`
- [ ] `REGION=us-east-1`
- [ ] `SERVICE_NAME=smartboxing`

### serverless.yml
- [x] Plugin `serverless-s3-sync` instalado ✅
- [x] Plugin `serverless-scriptable-plugin` instalado ✅
- [x] Build script frontend configurado ✅
- [x] Función `uploadLogo` con permisos S3 ✅
- [x] `AssetsBucket` creado ✅
- [x] `AssetsBucketPolicy` con acceso público a GetObject ✅

---

## 🧪 VALIDACIÓN PRE-DEPLOY

### Backend Handlers
- [x] `settings/client-get.js` existe ✅
- [x] `settings/client-put.js` existe ✅
- [x] `settings/upload-logo.js` existe ✅
- [x] `analytics/dashboard.js` usa variables correctas (T_*) ✅
- [x] Todos los handlers tienen `extractTenantId()` ✅

### Frontend
- [x] `SettingsNew.jsx` existe ✅
- [x] `App.jsx` importa `SettingsNew` ✅
- [x] `TopHeader.jsx` muestra logo dinámico ✅
- [x] `api/settings.js` tiene `uploadLogo()` ✅

### Schemas Zod
- [x] `ClientThemeSchema` en `settings/schemas.js` ✅
- [x] `ScheduleConfigSchema` en `settings/schemas.js` ✅
- [x] `OperationalSettingsSchema` en `settings/schemas.js` ✅
- [x] `BrandingSchema` en `settings/schemas.js` ✅

---

## 🚀 COMANDOS DE DEPLOY

### 1. Verificar Estado
```bash
cd /c/Users/matti/Documents/UDD/Arquitectura/smartboxing
sls info
```

### 2. Deploy Backend + Frontend
```bash
# Deploy completo (tarda ~5-10 minutos)
sls deploy --verbose

# Salida esperada:
# ✅ CloudFormation stack update
# ✅ 29 Lambda functions deployed
# ✅ API Gateway endpoints
# ✅ S3 buckets created (AssetsBucket nuevo)
# ✅ Frontend build + sync a S3
```

### 3. Obtener URLs
```bash
sls info --verbose

# Outputs esperados:
# - ServiceEndpoint: https://xxxxxx.execute-api.us-east-1.amazonaws.com
# - FrontendUrl: https://smartboxing-frontend-prod-v2.s3.amazonaws.com/index.html
# - CloudFrontUrl: https://xxxxx.cloudfront.net
# - AssetsBucketName: smartboxing-assets-prod
```

---

## ✅ VALIDACIÓN POST-DEPLOY

### 1. Health Check
```bash
# Backend health
curl https://xxxxxx.execute-api.us-east-1.amazonaws.com/health

# Respuesta esperada:
# {
#   "status": "healthy",
#   "timestamp": "2025-11-17T...",
#   "version": "1.0"
# }
```

### 2. Frontend Accesible
- [ ] Abrir CloudFront URL en navegador
- [ ] Página Login carga correctamente
- [ ] No errores en consola del navegador
- [ ] CSS se aplica correctamente

### 3. Autenticación
- [ ] Click en "Iniciar Sesión"
- [ ] Redirige a Cognito Hosted UI
- [ ] Registrar nuevo usuario (email + password)
- [ ] Verificar email
- [ ] Login exitoso
- [ ] Redirige a Dashboard

### 4. Flujo de Parametrización (CRÍTICO - 40 puntos)
- [ ] **Ir a Settings**
  - Menú lateral → Settings
  
- [ ] **Tab 1: Identidad Visual**
  - [ ] Cambiar nombre institución → Guardar → Ver cambio en TopHeader
  - [ ] Cambiar color primario → Guardar → Ver cambio en botones
  - [ ] Upload logo (PNG/JPG):
    1. Click "Elegir archivo"
    2. Seleccionar imagen < 2MB
    3. Ver preview
    4. Click "Guardar Configuración"
    5. Ver logo en TopHeader
  
- [ ] **Tab 2: Horarios**
  - [ ] Cambiar hora inicio: 09:00
  - [ ] Cambiar hora fin: 18:00
  - [ ] Cambiar duración slot: 45 min
  - [ ] Seleccionar días: Lun-Vie
  - [ ] Guardar
  
- [ ] **Tab 3: Configuración Operacional**
  - [ ] Toggle "Permitir citas solapadas"
  - [ ] Toggle "Enviar recordatorios"
  - [ ] Cambiar horas antes: 48
  - [ ] Guardar
  
- [ ] **Tab 4: Preferencias de Usuario**
  - [ ] Cambiar tema: Oscuro
  - [ ] Ver cambio visual inmediato
  - [ ] Guardar

### 5. Crear Datos de Prueba
- [ ] **Box:**
  - Ir a Boxes → Nuevo Box
  - Nombre: "Consultorio 1"
  - Capacidad: 2
  - Equipamiento: ["Camilla", "Estetoscopio"]
  - Guardar
  
- [ ] **Doctor:**
  - Ir a Médicos → Nuevo Médico
  - Nombre: "Dr. Juan Pérez"
  - Especialidad: "Medicina General"
  - Email: "jperez@test.cl"
  - Guardar
  
- [ ] **Paciente:**
  - Ir a Pacientes → Nuevo Paciente
  - Nombre: "María González"
  - RUT: "12345678-9"
  - Email: "mgonzalez@test.cl"
  - Guardar
  
- [ ] **Cita:**
  - Ir a Citas → Nueva Cita
  - Paciente: María González
  - Médico: Dr. Juan Pérez
  - Box: Consultorio 1
  - Fecha: Hoy + 1 día
  - Hora: Dentro del horario configurado (09:00-18:00)
  - Guardar
  - ✅ Debe respetar horarios de settings

### 6. Analytics Dashboard
- [ ] Ir a Dashboard
- [ ] Ver KPIs:
  - [ ] Total citas
  - [ ] Boxes disponibles
  - [ ] Médicos activos
  - [ ] Pacientes registrados
- [ ] Filtrar por:
  - [ ] Rango de fechas
  - [ ] Box específico
  - [ ] Médico específico
- [ ] Ver gráficos actualizados

### 7. Multi-Tenant Isolation
- [ ] **Cerrar sesión**
- [ ] **Registrar segundo usuario** (diferente email)
- [ ] Login con usuario 2
- [ ] Ir a Boxes → NO debe ver boxes del usuario 1
- [ ] Ir a Settings → Configurar logo DIFERENTE
- [ ] Ver que cada usuario tiene su propia configuración

---

## 🔒 VALIDACIÓN DE SEGURIDAD

### Headers de Seguridad (CloudFront)
```bash
curl -I https://xxxxx.cloudfront.net

# Verificar headers:
# ✅ X-Content-Type-Options: nosniff
# ✅ X-Frame-Options: DENY
# ✅ X-XSS-Protection: 1; mode=block
# ✅ Strict-Transport-Security: max-age=31536000
```

### JWT Validation
```bash
# Sin token → 401
curl https://xxxxxx.execute-api.us-east-1.amazonaws.com/boxes

# Con token inválido → 401
curl -H "Authorization: Bearer fake-token" https://xxxxxx.../boxes

# Con token válido → 200
curl -H "Authorization: Bearer {real-jwt}" https://xxxxxx.../boxes
```

### S3 Assets Bucket
```bash
# Debe permitir GET público
curl -I https://smartboxing-assets-prod.s3.amazonaws.com/test-logo.png

# Debe denegar PUT sin credentials
curl -X PUT https://smartboxing-assets-prod.s3.amazonaws.com/hack.txt
# Expected: 403 Forbidden
```

---

## 🎯 CRITERIOS DE ÉXITO (EXAMEN)

### 1. Funcionamiento (40 pts) - CRÍTICO
- [x] ✅ Cliente puede registrarse
- [ ] ✅ Acceso a Settings funciona
- [ ] ✅ Puede configurar: logo, colores, nombre, horarios
- [ ] ✅ Cambios se aplican en toda la UI
- [ ] ✅ Crear cita respeta parametrización (horarios)
- [ ] ✅ Multi-tenant verificado (2 usuarios diferentes)

**Si falla cualquiera → 0/40 puntos**

### 2. Informe Arquitectura (20 pts)
- [x] ✅ README.md actualizado
- [x] ✅ ARCHITECTURE.md creado
- [x] ✅ Decisiones documentadas
- [x] ✅ Trade-offs justificados

### 3. Laboratorios (20 pts)
- [x] ✅ Confirmado por estudiante

### 4. Tests (20 pts)
- [x] ✅ OWASP: 38 tests pasando (78% coverage)
- [x] ✅ WCAG: 17 tests pasando (75% coverage)
- [ ] ✅ CI/CD workflows ejecutados en GitHub

---

## 🚨 TROUBLESHOOTING

### Error: "Bucket already exists"
```bash
# Cambiar nombre del bucket en serverless.yml
bucketName: ${self:service}-frontend-${sls:stage}-v3
```

### Error: "Cold start timeout"
```bash
# Ejecutar warmup manual
sls invoke -f warmup
```

### Error: "CORS blocked"
```bash
# Verificar CORS en API Gateway
sls info
# Debe mostrar: cors: true
```

### Frontend no carga
```bash
# Verificar build
cd frontend
npm run build
ls dist/  # Debe tener index.html

# Verificar sync
sls s3sync
```

### Logo no se sube
```bash
# Verificar permisos IAM
aws s3 ls s3://smartboxing-assets-prod/

# Verificar presigned URL
curl -X POST https://xxxxx/settings/upload-logo \
  -H "Authorization: Bearer {jwt}" \
  -d '{"fileName":"test.png","fileType":"image/png"}'
```

---

## 📊 MÉTRICAS OBJETIVO

| Métrica | Objetivo | Validación |
|---------|----------|------------|
| **Deploy time** | < 10 min | `time sls deploy` |
| **Health check** | < 200ms | `curl -w "%{time_total}" .../health` |
| **Frontend load** | < 3s | Chrome DevTools Network |
| **Tests backend** | 38 passing | `npm test` |
| **Tests frontend** | 17 passing | `npm test` |
| **OWASP coverage** | > 70% | GitHub Actions |
| **WCAG coverage** | > 75% | axe-core report |

---

## ✅ FIRMA DE APROBACIÓN

**Backend Tests:** ✅ 38/38 pasando  
**Frontend Tests:** ✅ 17/17 pasando  
**Documentación:** ✅ README + ARCHITECTURE.md  
**Credenciales AWS:** ⏳ PENDIENTE  
**Deploy:** ⏳ PENDIENTE  
**Validación E2E:** ⏳ PENDIENTE  

---

**PRÓXIMO PASO:** Configurar credenciales AWS y ejecutar `sls deploy --verbose`
