# SmartBoxing 🏥
Sistema de gestión de boxes y citas médicas con arquitectura serverless en AWS.

---

## 🚀 Quick Start

### Prerequisitos

- Node.js 22+
- AWS CLI configurado
- Cuenta AWS

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/MattiasMR/smartboxing.git
cd smartboxing

# Instalar dependencias
npm install

# Configurar credenciales AWS
export AWS_ACCESS_KEY_ID=xxx
export AWS_SECRET_ACCESS_KEY=xxx
export AWS_SESSION_TOKEN=xxx  # Solo AWS Academy

# Deploy completo (backend + frontend)
npm run deploy
```

### Desarrollo Local

```bash
# Frontend (http://localhost:5173)
cd frontend
npm run dev

# Ver logs de backend
serverless logs -f nombreFuncion --tail
```

---

## 🛠️ Stack Tecnológico

### Backend
- **Runtime:** Node.js 22
- **Framework:** Serverless Framework 4.23
- **API:** AWS API Gateway HTTP + Lambda (28 funciones)
- **Database:** DynamoDB (PAY_PER_REQUEST)
- **Auth:** AWS Cognito (OAuth2 + JWT)
- **Validation:** Zod
- **Testing:** Vitest

### Frontend
- **Framework:** React 19
- **Build:** Vite 7 
- **Routing:** React Router 7
- **State:** TanStack Query 5
- **Forms:** React Hook Form + Zod
- **HTTP:** Axios

### DevOps
- **CI/CD:** GitHub Actions
- **IaC:** CloudFormation (via Serverless)
- **Hosting:** S3 + CloudFront
- **Logs:** CloudWatch
- **Networking:** VPC privada (10.0.0.0/16) 🔒
- **Security:** Security Groups + VPC Endpoints (DynamoDB/S3)

---

## 📡 API Endpoints

**Base URL:** `https://kpg3oyur0d.execute-api.us-east-1.amazonaws.com`

### Recursos Principales

| Recurso | Endpoints |
|---------|-----------|
| **Health** | `GET /health` |
| **Boxes** | `GET POST PUT DELETE /boxes` |
| **Doctors** | `GET POST PUT DELETE /doctors` |
| **Appointments** | `GET POST PUT DELETE /appointments` |
| **Patients** | `GET POST PUT DELETE /patients` |
| **Analytics** | `GET /analytics/dashboard` |
| **Settings** | `GET PUT /settings/client` `GET PUT /settings/user` |
| **Seed** | `POST /seed/bulk` `POST /seed/clear` |

**Total:** 28 endpoints REST con autenticación JWT (excepto `/health`)

---

## � Scripts

```bash
# Instalación
npm install              # Instalar dependencias root + backend + frontend

# Deploy
npm run deploy           # Deploy completo a AWS (dev)
npm run deploy:prod      # Deploy a producción
npm run remove           # Eliminar stack de AWS

# Build
npm run build:frontend   # Build solo frontend

# Utilidades
npm run info             # Ver información del deployment
npm run generate:env     # Generar .env frontend
```

---

## 🔐 Autenticación

- **Tipo:** OAuth2 Implicit Flow
- **Provider:** AWS Cognito
- **User Pool:** `us-east-1_AINTiD5yB`
- **Token:** JWT Bearer en header `Authorization`
- **Multi-tenancy:** Claim `custom:tenantId`

---

## 🔒 Seguridad y Networking

### VPC Privada

**Arquitectura:**
- **VPC:** `10.0.0.0/16` 
- **Subnets Privadas:** 
  - us-east-1a: `10.0.10.0/24`
  - us-east-1b: `10.0.11.0/24`
- **Security Group:** Egress solo a HTTPS (443) dentro de VPC
- **VPC Endpoints:** DynamoDB + S3 (Gateway)
- **Flow Logs:** CloudWatch `/aws/vpc/smartboxing-dev`

---

## 🌍 URLs de Producción

| Servicio | URL |
|----------|-----|
| **Frontend** | https://dge2h61tdyb0m.cloudfront.net |
| **API** | https://kpg3oyur0d.execute-api.us-east-1.amazonaws.com |
| **CI/CD** | https://github.com/MattiasMR/smartboxing/actions |

---

## 📝 Licencia

MIT License

---

**Versión:** 1.0 | **Estado:** Producción 
