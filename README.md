# SmartBoxing 🥊

Sistema de gestión de boxes y citas médicas con arquitectura serverless en AWS.

---

## 🚀 Quick Start

### Prerequisitos

- **Node.js 22+** (verificar con `node --version`)
- **npm** (incluido con Node.js)
- **AWS CLI** configurado (instalar desde https://aws.amazon.com/cli/)
- **Cuenta AWS** (AWS Academy o cuenta personal)
- **Serverless Framework** instalado globalmente:
  ```bash
  npm install -g serverless
  ```

### Instalación y Primer Deploy

**IMPORTANTE:** Sigue estos pasos en orden para un deploy exitoso.

```bash
# 1. Clonar repositorio
git clone https://github.com/MattiasMR/smartboxing.git
cd smartboxing

# 2. Instalar dependencias del proyecto raíz
npm install

# 3. Instalar dependencias del backend
cd backend
npm install
cd ..

# 4. Instalar dependencias del frontend
cd frontend
npm install
cd ..

# 5. Configurar credenciales AWS
# Para AWS Academy (incluye session token):
set AWS_ACCESS_KEY_ID=tu_access_key_id
set AWS_SECRET_ACCESS_KEY=tu_secret_access_key
set AWS_SESSION_TOKEN=tu_session_token

# Para cuenta AWS personal (sin session token):
set AWS_ACCESS_KEY_ID=tu_access_key_id
set AWS_SECRET_ACCESS_KEY=tu_secret_access_key

# Opcional: Configurar región (por defecto: us-east-1)
set AWS_REGION=us-east-1

# 6. Verificar credenciales AWS
aws sts get-caller-identity

# 7. (OPCIONAL) Ejecutar tests antes del deploy
cd backend
npm test
cd ../frontend
npm test
cd ..

# 8. Deploy completo (backend + frontend)
# Tiempo estimado: 6-8 minutos
sls deploy

# 9. Al finalizar, verás:
# ✔ Service deployed to stack smartboxing-dev
# endpoints: https://xxx.execute-api.us-east-1.amazonaws.com/...
# Frontend URL: https://xxx.cloudfront.net
```

5. **Costos estimados de SmartBoxing**:

   - **DynamoDB**: ~$0-2 USD/mes (PAY_PER_REQUEST, depende del uso)
   - **Lambda**: Free tier cubre hasta 1M requests/mes
   - **S3**: ~$0.50-1 USD/mes (3 buckets)
   - **CloudFront**: ~$0-1 USD/mes (bajo tráfico)
   - **API Gateway**: ~$3.50 USD/millón requests
   - **Cognito**: Free tier hasta 50,000 MAU
   - **TOTAL ESTIMADO**: $0-5 USD/mes con tráfico bajo

### Eliminar Recursos (Limpiar Deploy)

Para eliminar todos los recursos y evitar costos:

```bash
# 1. Eliminar el stack completo de CloudFormation
sls remove

# 2. Verificar que se eliminaron los recursos
aws cloudformation list-stacks --stack-status-filter DELETE_COMPLETE --query "StackSummaries[?StackName=='smartboxing-dev']"

# 3. (Opcional) Limpiar buckets S3 manualmente si quedaron archivos
aws s3 rb s3://smartboxing-frontend-dev-v3 --force
aws s3 rb s3://smartboxing-assets-dev-v3 --force
aws s3 rb s3://smartboxing-deployment-dev-384722508633 --force
```

**IMPORTANTE**: `sls remove` elimina:

- Todas las funciones Lambda
- Tablas DynamoDB (¡se pierden los datos!)
- API Gateway
- Cognito User Pool y dominio
- CloudFront distribution
- Buckets S3 (si están vacíos)

**NO elimina automáticamente**:

- Logs de CloudWatch (estos se borran después de 30 días)
- Buckets S3 con contenido (hay que vaciarlos primero)

---

## 🐤 CI/CD y Canary Deployment

### Estrategia Dual de Deployment

SmartBoxing utiliza una estrategia dual para deployments seguros y controlados:

#### 1. **Development (Automático)**
- **Trigger:** Push a la rama `main`
- **Tipo:** Deployment normal (sin canary)
- **Duración:** ~5-8 minutos
- **Propósito:** Testing rápido de nuevas features

```bash
# Hacer push a main dispara el deploy automático a dev
git push origin main
```

#### 2. **Production (Manual con Canary)**
- **Trigger:** Manual via GitHub Actions
- **Tipo:** Canary deployment progresivo
- **Configuración:** 10% → 50% → 100%
- **Timeline:** 10% (5min) → 50% (10min) → 100% (5min)
- **Duración total:** ~20-25 minutos
- **Rollback:** Automático si falla CloudWatch Alarms

**Cómo ejecutar deploy canary a producción:**

1. Ir a **Actions** en GitHub
2. Seleccionar workflow **"🚀 Deploy SmartBoxing"**
3. Click en **"Run workflow"**
4. Seleccionar `stage: prod`
5. Aprobar deployment (requiere aprobación manual)
6. Monitorear progreso del canary

### Monitoreo del Canary Deployment

El script `canary-monitor.mjs` permite monitorear en tiempo real:

```bash
# Monitorear deployment en producción (timeout 20min)
node scripts/canary-monitor.mjs --stage=prod --timeout=20

# Monitorear deployment en desarrollo (si se configura)
node scripts/canary-monitor.mjs --stage=dev

# Ver opciones disponibles
node scripts/canary-monitor.mjs --help
```

**Output del monitoring:**
- ✅ Estado del deployment (InProgress, Succeeded, Failed)
- 📊 Métricas de CloudWatch (errores, latencia, throttles)
- 🕐 Timeline y progreso (10% → 50% → 100%)
- ⚠️ Alertas en tiempo real
- 🔄 Detección automática de rollback

### Funciones con Canary Deployment

Las siguientes 11 funciones críticas usan canary deployment en producción:

| Categoría | Funciones |
|-----------|-----------|
| **Boxes** | `listBoxes`, `getBox`, `createBox` |
| **Staff** | `listStaff`, `createStaffMember` |
| **Appointments** | `listAppointments`, `getAppointment`, `createAppointment` |
| **Patients** | `listPatients` |
| **Settings** | `getClientSettings` |
| **Analytics** | `getDashboard` |

**Nota:** Operaciones de actualización y eliminación NO usan canary para evitar inconsistencias de datos.

### CloudWatch Alarms (Rollback Automático)

El canary deployment se revierte automáticamente si se disparan estas alarmas:

- **CanaryErrorAlarm:** >5 errores en 2 minutos
- **CanaryLatencyAlarm:** P99 latency >2000ms
- **CanaryThrottleAlarm:** >5 throttles en 2 minutos

Las alertas se envían a: **milan.munoz@udd.cl** vía SNS.

### Testing del Canary Deployment

Valida el canary deployment con el script de testing:

```bash
# Test de rollback con simulación de errores
node scripts/test-canary-rollback.mjs \
  --scenario=errors \
  --function=listBoxes \
  --stage=prod \
  --iterations=10

# Test de rollback con simulación de latencia alta
node scripts/test-canary-rollback.mjs \
  --scenario=latency \
  --function=getBox \
  --stage=prod \
  --iterations=15

# Test de rollback con simulación de throttles
node scripts/test-canary-rollback.mjs \
  --scenario=throttle \
  --function=createBox \
  --stage=prod \
  --iterations=20

# Ver ayuda y opciones
node scripts/test-canary-rollback.mjs --help
```

**Escenarios de Testing:**
- **errors:** Simula >5 errores/2min para disparar CanaryErrorAlarm
- **latency:** Simula latencia p99 >2000ms para disparar CanaryLatencyAlarm
- **throttle:** Simula >5 throttles/2min para disparar CanaryThrottleAlarm

El script activa chaos mode, ejecuta invocaciones, valida alarmas, y desactiva chaos mode automáticamente.

📖 **Documentación Completa:**
- Testing Guide: `docs/TESTING_GUIDE.md`
- Evidencia Académica: `docs/EVIDENCIA_CANARY.md`
- Plan de Implementación: `docs/CANARY_DEPLOYMENT_PLAN.md`
- Estado Actual: `docs/estadoCanario.md`

---

### Desarrollo Local

```bash
# Frontend (http://localhost:5173)
cd frontend
npm run dev

# Ver logs de backend en tiempo real
sls logs -f listBoxes --tail

# Ver logs de una función específica
sls logs -f createAppointment --tail

# Invocar función localmente
sls invoke local -f health
```

---

## Stack Tecnológico

### Backend

- **Runtime:** Node.js 22
- **Framework:** Serverless Framework 4
- **API:** AWS API Gateway HTTP + Lambda
- **Database:** DynamoDB (PAY_PER_REQUEST)
- **Auth:** AWS Cognito (OAuth2 + JWT)
- **Validation:** Zod
- **Storage:** S3 + CloudFront

### Frontend

- **Framework:** React 19
- **Build:** Vite 7
- **Routing:** React Router 7
- **State:** TanStack Query 5
- **Forms:** React Hook Form + Zod
- **UI:** CSS personalizado + variables theming

### DevOps

- **CI/CD:** GitHub Actions (dual deployment strategy)
  - **Development:** Normal deployment on push to `main`
  - **Production:** Canary deployment with manual trigger (10% → 50% → 100%)
- **Canary Deployment:** AWS CodeDeploy with automatic rollback
  - CloudWatch Alarms: Error rate, latency (p99), throttle rate
  - Pre/Post-traffic Lambda hooks for validation
  - Real-time monitoring with `scripts/canary-monitor.mjs`
  - 11 critical functions with progressive deployment
- **IaC:** CloudFormation (via Serverless)
- **Hosting:** S3 + CloudFront
- **Logs:** CloudWatch
- **Chaos Engineering:** Fault injection automático 🌪️

### Testing

- **Unit Tests:** Vitest
- **Integration Tests:** Canary deployment with rollback validation
- **Security:** OWASP ZAP, npm audit, Gitleaks
- **Accessibility:** axe-core, jest-axe, Lighthouse CI, Pa11y
- **Chaos Engineering:** Fault injection with `test-canary-rollback.mjs`
- **Coverage:** ~78% OWASP Top 10, ~75% WCAG 2.1 AA

**Canary Testing Commands:**
```bash
# Run unit tests
npm test

# Test canary rollback (requires AWS credentials)
node scripts/test-canary-rollback.mjs --scenario=errors --function=listBoxes --stage=prod

# Monitor active canary deployment
node scripts/canary-monitor.mjs --stage=prod
```

---

## API Endpoints

**Base URL:** `https://7dkjmfntz3.execute-api.us-east-1.amazonaws.com`
**Frontend URL:** `https://d2t6idr08mvsaj.cloudfront.net`

### Recursos Principales

| Recurso                | Endpoints                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **Health**       | `GET /health`                                                                        |
| **Boxes**        | `GET POST PUT DELETE /boxes`                                                         |
| **Doctors**      | `GET POST PUT DELETE /doctors`                                                       |
| **Appointments** | `GET POST PUT DELETE /appointments`                                                  |
| **Patients**     | `GET POST PUT DELETE /patients`                                                      |
| **Analytics**    | `GET /analytics/dashboard?startDate&endDate&boxId&doctorId`                          |
| **Settings**     | `GET PUT /settings/client` `GET PUT /settings/user` `POST /settings/upload-logo` |
| **Seed**         | `POST /seed/bulk` `DELETE /seed/clear`                                             |

**Total:** 29 funciones Lambda | **Auth:** JWT (excepto `/health`)

### Settings API (Parametrización)

El sistema permite parametrización completa por cliente:

```bash
# Obtener configuración actual
GET /settings/client

# Actualizar configuración
PUT /settings/client
{
  "theme": {
    "primaryColor": "#3B82F6",
    "secondaryColor": "#10B981",
    "accentColor": "#F59E0B",
    "darkMode": false,
    "logoUrl": "https://..."
  },
  "texts": {
    "appName": "MiClinica",
    "institutionName": "Centro Médico XYZ",
    "welcomeMessage": "Bienvenido",
    "tagline": "Tu salud es nuestra prioridad"
  },
  "schedule": {
    "startTime": "08:00",
    "endTime": "20:00",
    "slotDuration": 30,
    "workDays": [1,2,3,4,5]
  },
  "operational": {
    "allowOverlapping": false,
    "requireConfirmation": true,
    "sendReminders": true,
    "reminderHours": 24,
    "maxAppointmentsPerDay": 50,
    "enableWaitlist": true
  },
  "branding": {
    "companyName": "Centro Médico XYZ",
    "contactEmail": "contacto@ejemplo.cl",
    "contactPhone": "+56912345678",
    "website": "https://ejemplo.cl",
    "address": "Av. Principal 123"
  }
}

# Upload de logo (presigned URL)
POST /settings/upload-logo
{
  "fileName": "logo.png",
  "fileType": "image/png"
}
# Response: { "uploadUrl": "https://s3...", "fileUrl": "https://cloudfront..." }
```

---

## Scripts Útiles

```bash
# ===== DEPLOY Y GESTIÓN =====
sls deploy              # Deploy completo a AWS (6-8 min)
sls deploy -f health    # Deploy solo una función específica
sls info                # Ver info del deployment actual
sls remove              # Eliminar todo el stack de AWS

# ===== LOGS Y MONITOREO =====
sls logs -f listBoxes --tail           # Ver logs en tiempo real
sls logs -f createAppointment --startTime 1h  # Logs última hora
sls invoke -f health                   # Invocar función en AWS
sls invoke local -f health             # Invocar función localmente

# ===== TESTING =====
cd backend && npm test                 # Todos los tests backend
cd backend && npm run test:security    # Solo tests OWASP
cd backend && npm run test:coverage    # Con cobertura

cd frontend && npm test                # Tests de accesibilidad
cd frontend && npm run test:a11y       # Solo WCAG tests
cd frontend && npm run test:coverage   # Con cobertura

# ===== DESARROLLO LOCAL =====
cd frontend && npm run dev             # Frontend local (localhost:5173)
cd backend && npm run dev              # Serverless offline (si está configurado)

# ===== CHAOS ENGINEERING 🌪️ =====
npm run chaos:enable                   # Habilitar fault injection (10% error, 10% latency)
npm run chaos:disable                  # Deshabilitar chaos
npm run chaos:status                   # Ver estado actual

# Personalizar chaos
node scripts/chaos-toggle.mjs enable --error-rate=0.2 --latency-rate=0.3

# ===== AWS CLI ÚTILES =====
# Ver estado del stack
aws cloudformation describe-stacks --stack-name smartboxing-dev --region us-east-1

# Listar todos los buckets
aws s3 ls

# Ver User Pools de Cognito
aws cognito-idp list-user-pools --max-results 10 --region us-east-1

# Ver tablas DynamoDB
aws dynamodb list-tables --region us-east-1

# Ver funciones Lambda
aws lambda list-functions --region us-east-1 --query "Functions[?starts_with(FunctionName, 'smartboxing')].FunctionName"

# Verificar costos actuales
aws ce get-cost-and-usage --time-period Start=2025-12-01,End=2025-12-31 --granularity MONTHLY --metrics "UnblendedCost"
```

sls remove              # Eliminar stack
sls info                # Ver info del deployment

# Testing

cd backend && npm test          # Todos los tests
cd backend && npm run test:security    # Solo tests OWASP
cd backend && npm run test:coverage    # Con cobertura

cd frontend && npm test         # Tests de accesibilidad
cd frontend && npm run test:a11y       # Solo WCAG tests
cd frontend && npm run test:coverage   # Con cobertura

# Desarrollo

cd frontend && npm run dev      # Frontend local
cd backend && npm run dev       # Serverless offline

# Chaos Engineering 🌪️

npm run chaos:enable     # Habilitar fault injection (10% error, 10% latency)
npm run chaos:disable    # Deshabilitar chaos
npm run chaos:status     # Ver estado actual

# Personalizar chaos

node scripts/chaos-toggle.mjs enable --error-rate=0.2 --latency-rate=0.3

---

## Autenticación

- **Tipo:** OAuth2 Implicit Flow
- **Provider:** AWS Cognito
- **Token:** JWT Bearer en header `Authorization`
- **Multi-tenancy:** Claim `custom:tenantId`

### Crear primer usuario

```bash
# Opción 1: Desde la consola AWS
# https://console.aws.amazon.com/cognito → User Pools → smartboxing-dev-v3

# Opción 2: AWS CLI
aws cognito-idp sign-up \
  --client-id TU_CLIENT_ID \
  --username admin@ejemplo.com \
  --password TuPassword123! \
  --user-attributes Name=email,Value=admin@ejemplo.com

# Confirmar usuario (admin)
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id us-east-1_yPICowaHF \
  --username admin@ejemplo.com
```

---

## Troubleshooting

### Error: "Stack does not exist"

```bash
# El stack fue eliminado o es el primer deploy
# Solución: Continuar con sls deploy
```

### Error: "Bucket already exists"

```bash
# Hay buckets huérfanos de deploys anteriores
# Solución: Ya está resuelto con sufijo -v3 en el código
```

### Error: "Domain already associated"

```bash
# Dominio de Cognito en uso
# Solución: Ya está resuelto con sufijo -v3 en el código
```

### Error: Credenciales AWS expiradas (AWS Academy)

```bash
# Las credenciales AWS Academy expiran cada 4 horas
# Solución: Obtener nuevas credenciales del Learner Lab
set AWS_ACCESS_KEY_ID=nueva_key
set AWS_SECRET_ACCESS_KEY=nueva_secret
set AWS_SESSION_TOKEN=nuevo_token
```

### Frontend no carga después del deploy

```bash
# CloudFront puede tardar en propagarse
# Solución: Esperar 5-10 minutos o usar la URL de S3 directamente
```

---

## Licencia

MIT License

---

**Versión:** 1.0 | **Estado:** Producción
