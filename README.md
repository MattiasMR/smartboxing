# SmartBoxing 🏥
Sistema de gestión de boxes y citas médicas con arquitectura serverless en AWS.

---

## 🚀 Quick Start

### Prerequisitos

- Node.js 22+
- AWS CLI configurado
- Cuenta AWS

### Instalación y Deploy

```bash
# Clonar repositorio
git clone https://github.com/MattiasMR/smartboxing.git
cd smartboxing

# Instalar dependencias
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# Configurar credenciales AWS
export AWS_ACCESS_KEY_ID=xxx
export AWS_SECRET_ACCESS_KEY=xxx
export AWS_SESSION_TOKEN=xxx  # Solo AWS Academy

# Ejecutar tests (opcional)
cd backend && npm test
cd ../frontend && npm test
cd ..

# Deploy completo (backend + frontend)
sls deploy
```

### Desarrollo Local

```bash
# Frontend (http://localhost:5173)
cd frontend
npm run dev

# Ver logs de backend
sls logs -f listBoxes --tail
```

---

## 🛠️ Stack Tecnológico

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
- **CI/CD:** GitHub Actions (3 workflows: deploy, security, accessibility)
- **IaC:** CloudFormation (via Serverless)
- **Hosting:** S3 + CloudFront
- **Logs:** CloudWatch
- **Chaos Engineering:** Fault injection automático 🌪️

### Testing
- **Unit Tests:** Vitest
- **Security:** OWASP ZAP, npm audit, Gitleaks
- **Accessibility:** axe-core, jest-axe, Lighthouse CI, Pa11y
- **Coverage:** ~78% OWASP Top 10, ~75% WCAG 2.1 AA

---

## 📡 API Endpoints

**Base URL:** `https://ocpzcn4cu6.execute-api.us-east-1.amazonaws.com`

### Recursos Principales

| Recurso | Endpoints |
|---------|-----------||
| **Health** | `GET /health` |
| **Boxes** | `GET POST PUT DELETE /boxes` |
| **Doctors** | `GET POST PUT DELETE /doctors` |
| **Appointments** | `GET POST PUT DELETE /appointments` |
| **Patients** | `GET POST PUT DELETE /patients` |
| **Analytics** | `GET /analytics/dashboard?startDate&endDate&boxId&doctorId` |
| **Settings** | `GET PUT /settings/client` `GET PUT /settings/user` `POST /settings/upload-logo` |
| **Seed** | `POST /seed/bulk` `DELETE /seed/clear` |

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

## 📝 Scripts Útiles

```bash
# Deploy
sls deploy              # Deploy a AWS
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
```

---

## 🔐 Autenticación

- **Tipo:** OAuth2 Implicit Flow
- **Provider:** AWS Cognito
- **Token:** JWT Bearer en header `Authorization`
- **Multi-tenancy:** Claim `custom:tenantId`

---

## 📝 Licencia

MIT License

---

**Versión:** 1.0 | **Estado:** Producción 
