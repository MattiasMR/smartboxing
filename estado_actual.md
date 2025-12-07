# SmartBoxing - Estado Actual del Sistema
> Documento generado: 7 de Diciembre 2025
> Última revisión verificada contra AWS y código fuente

---

## 📋 Resumen Ejecutivo

SmartBoxing es un sistema SaaS multi-tenant para gestión de boxes médicos, staff y citas. El sistema permite a múltiples organizaciones (tenants) operar de forma aislada con sus propios datos.

**URL de Producción Dev:** https://smartboxing.dev

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CloudFront                                   │
│  EAA3OU56GBIPU (dev) → smartboxing.dev                              │
│  E8COQ0XHE82ZS (prod) → dge2h61tdyb0m.cloudfront.net                │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
        ┌───────────────────┐           ┌───────────────────┐
        │   S3 Frontend     │           │   API Gateway     │
        │   (React SPA)     │           │   HTTP API v2     │
        └───────────────────┘           └───────────────────┘
                                                │
                                    ┌───────────┴───────────┐
                                    ▼                       ▼
                            ┌─────────────┐         ┌─────────────┐
                            │   Cognito   │         │   Lambda    │
                            │  User Pool  │         │  Functions  │
                            └─────────────┘         └─────────────┘
                                                          │
                                                    ┌─────┴─────┐
                                                    ▼           ▼
                                            ┌──────────┐ ┌──────────┐
                                            │ DynamoDB │ │    S3    │
                                            │  Tables  │ │  Assets  │
                                            └──────────┘ └──────────┘
```

---

## 🔐 Credenciales y Accesos

### Super Admin (Dev)
| Campo | Valor |
|-------|-------|
| Email | `moralesmattias@gmail.com` |
| Password | `Admin1234!` |
| Rol | `super_admin` |
| URL Login | https://smartboxing.dev/login |

### Usuarios Registrados en Cognito Dev (`us-east-1_flcHOKjMy`)

| Email | Estado | Rol | TenantId |
|-------|--------|-----|----------|
| moralesmattias@gmail.com | CONFIRMED | super_admin | - |
| mattimoru@hotmail.com | CONFIRMED | tenant_admin | 914c345c-31d4-4088-8829-872667dc0fbe |
| m.moralesr@udd.cl | CONFIRMED | staff | - |
| carlosmorales@gmx.net | CONFIRMED | staff | - |
| m.kurtec@udd.cl | CONFIRMED | (null) | - |
| pempeight8@gmail.com | CONFIRMED | (null) | - |

---

## ☁️ Recursos AWS

### Región: `us-east-1`
### Account ID: `624991056069`

### API Gateway HTTP v2

| Ambiente | API ID | Endpoint |
|----------|--------|----------|
| Dev | `ocpzcn4cu6` | https://ocpzcn4cu6.execute-api.us-east-1.amazonaws.com |
| Prod | `kpg3oyur0d` | https://kpg3oyur0d.execute-api.us-east-1.amazonaws.com |

### Cognito User Pools

| Ambiente | Pool ID | Pool Name |
|----------|---------|-----------|
| Dev | `us-east-1_flcHOKjMy` | smartboxing-dev |
| Prod | `us-east-1_AINTiD5yB` | smartboxing-prod |

**Client IDs:**
- Dev: `7o3mbd6s94sp7jtb0p300pc4un`
- Cognito Domain Dev: `https://smartboxing-dev.auth.us-east-1.amazoncognito.com`

### CloudFront Distributions

| Ambiente | Distribution ID | Domain | Alias |
|----------|-----------------|--------|-------|
| Dev | `EAA3OU56GBIPU` | d3mydfxpimeym.cloudfront.net | smartboxing.dev |
| Prod | `E8COQ0XHE82ZS` | dge2h61tdyb0m.cloudfront.net | - |

### S3 Buckets (6 activos)

| Bucket | Propósito |
|--------|-----------|
| `smartboxing-frontend-dev-v2` | Frontend React SPA (dev) |
| `smartboxing-frontend-prod-v2` | Frontend React SPA (prod) |
| `smartboxing-assets-dev` | Logos y assets (dev) |
| `smartboxing-assets-prod` | Logos y assets (prod) |
| `smartboxing-deployment-dev-624991056069` | Serverless deployment artifacts (dev) |
| `smartboxing-deployment-prod-624991056069` | Serverless deployment artifacts (prod) |

---

## 📊 DynamoDB Tables (20 total: 10 dev + 10 prod)

### Tablas Core (por ambiente)

| Tabla | Partition Key | Sort Key | GSIs |
|-------|---------------|----------|------|
| `smartboxing-Boxes-{stage}` | `tenantId` | `id` | - |
| `smartboxing-Staff-{stage}` | `tenantId` | `id` | - |
| `smartboxing-Appointments-{stage}` | `tenantId` | `id` | - |
| `smartboxing-Patients-{stage}` | `tenantId` | `id` | - |

### Tablas Multi-Tenant

| Tabla | Partition Key | Sort Key | GSIs |
|-------|---------------|----------|------|
| `smartboxing-Tenants-{stage}` | `id` | - | - |
| `smartboxing-TenantUsers-{stage}` | `cognitoSub` | - | `ByTenant` (tenantId) |
| `smartboxing-TenancyRequests-{stage}` | `id` | - | `BySlug`, `ByRequester` |

### Tablas de Configuración

| Tabla | Partition Key | Sort Key |
|-------|---------------|----------|
| `smartboxing-ClientSettings-{stage}` | `tenantId` | - |
| `smartboxing-UserSettings-{stage}` | `tenantId` | `userSub` |
| `smartboxing-{stage}-feature-flags` | `flagName` | - |

### Datos Actuales en Dev

| Tabla | Registros |
|-------|-----------|
| Tenants | 1 |
| TenantUsers | 1 |
| TenancyRequests | 1 |
| Staff | 0 |
| Boxes | 0 |
| Appointments | 0 |
| Patients | 0 |

### Tenant Existente (Dev)

```json
{
  "id": "914c345c-31d4-4088-8829-872667dc0fbe",
  "name": "test",
  "slug": "test",
  "status": "active",
  "contactEmail": "mattimoru@hotmail.com",
  "createdBy": "moralesmattias@gmail.com",
  "maxUsers": 50
}
```

---

## 🔌 API Endpoints

### Health & System
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Health check |

### Boxes (requiere tenantId)
| Método | Ruta | Handler |
|--------|------|---------|
| GET | `/boxes` | `listBoxes` |
| GET | `/boxes/{id}` | `getBox` |
| POST | `/boxes` | `createBox` |
| PUT | `/boxes/{id}` | `updateBox` |
| DELETE | `/boxes/{id}` | `deleteBox` |

### Staff (requiere tenantId)
| Método | Ruta | Handler |
|--------|------|---------|
| GET | `/staff` | `listStaff` |
| GET | `/staff/{id}` | `getStaffMember` |
| POST | `/staff` | `createStaffMember` |
| PUT | `/staff/{id}` | `updateStaffMember` |
| DELETE | `/staff/{id}` | `deleteStaffMember` |

### Appointments (requiere tenantId)
| Método | Ruta | Handler |
|--------|------|---------|
| GET | `/appointments` | `listAppointments` |
| GET | `/appointments/{id}` | `getAppointment` |
| POST | `/appointments` | `createAppointment` |
| PUT | `/appointments/{id}` | `updateAppointment` |
| DELETE | `/appointments/{id}` | `deleteAppointment` |

### Patients (requiere tenantId)
| Método | Ruta | Handler |
|--------|------|---------|
| GET | `/patients` | `listPatients` |
| GET | `/patients/{id}` | `getPatient` |
| POST | `/patients` | `createPatient` |
| PUT | `/patients/{id}` | `updatePatient` |
| DELETE | `/patients/{id}` | `deletePatient` |

### Settings
| Método | Ruta | Handler | Descripción |
|--------|------|---------|-------------|
| GET | `/settings/client` | `getClientSettings` | Config del tenant |
| PUT | `/settings/client` | `updateClientSettings` | Actualizar config |
| POST | `/settings/upload-logo` | `uploadLogo` | Presigned URL para logo |
| GET | `/settings/user` | `getUserSettings` | Preferencias usuario |
| PUT | `/settings/user` | `updateUserSettings` | Actualizar preferencias |

### Admin - Tenants (super_admin only)
| Método | Ruta | Handler |
|--------|------|---------|
| GET | `/admin/tenants` | `listTenants` |
| GET | `/admin/tenants/{id}` | `getTenant` |
| POST | `/admin/tenants` | `createTenant` |
| PUT | `/admin/tenants/{id}` | `updateTenant` |
| DELETE | `/admin/tenants/{id}` | `deleteTenant` |
| GET | `/tenants` | `listTenantsPublic` |

### Admin - Users (tenant_admin o super_admin)
| Método | Ruta | Handler |
|--------|------|---------|
| GET | `/admin/users` | `listAdminUsers` |
| GET | `/admin/users/{id}` | `getAdminUser` |
| POST | `/admin/users` | `createAdminUser` |
| PUT | `/admin/users/{id}` | `updateAdminUser` |
| DELETE | `/admin/users/{id}` | `deleteAdminUser` |

### Tenancy Management
| Método | Ruta | Handler | Descripción |
|--------|------|---------|-------------|
| POST | `/tenancy/requests` | `createTenancyRequest` | Crear solicitud |
| GET | `/tenancy/requests` | `listTenancyRequests` | Listar solicitudes (soporta `?onlyMine=true`) |
| POST | `/tenancy/requests/{id}/review` | `reviewTenancyRequest` | Aprobar/rechazar |
| GET | `/tenancy/my-tenants` | `listUserTenancies` | Mis tenencias |
| POST | `/tenancy/switch` | `switchTenant` | Cambiar tenant activo |

### Canary/Feature Flags
| Método | Ruta | Handler |
|--------|------|---------|
| GET | `/canary/flags` | `listFeatureFlags` |
| GET | `/canary/flags/{flagName}` | `getFeatureFlag` |
| POST | `/canary/flags` | `upsertFeatureFlag` |
| PATCH | `/canary/flags/{flagName}/rollout` | `updateRollout` |
| POST | `/canary/flags/{flagName}/rollback` | `rollbackFeature` |
| GET | `/canary/evaluate` | `evaluateFlag` |
| DELETE | `/canary/flags/{flagName}` | `deleteFeatureFlag` |

### Seed/Testing
| Método | Ruta | Handler |
|--------|------|---------|
| POST | `/seed/bulk` | `seedBulk` |
| DELETE | `/seed/clear` | `seedClear` |

### Analytics
| Método | Ruta | Handler |
|--------|------|---------|
| GET | `/analytics/dashboard` | `getDashboard` |

---

## 🎨 Frontend - Páginas y Rutas

### Rutas Públicas
| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/` | `RootRedirect` | Redirige según auth y rol |
| `/login` | `LoginPage` | Login con Cognito |
| `/register` | `RegisterPage` | Registro de usuario |

### Rutas Protegidas (MainLayout)
| Ruta | Componente | Requiere Tenant |
|------|------------|-----------------|
| `/dashboard` | `Dashboard` | Sí |
| `/boxes` | `BoxesList` | Sí |
| `/boxes/new` | `BoxForm` | Sí |
| `/boxes/:id/edit` | `BoxForm` | Sí |
| `/staff` | `DoctorsList` | Sí |
| `/staff/new` | `DoctorForm` | Sí |
| `/staff/:id/edit` | `DoctorForm` | Sí |
| `/appointments` | `AppointmentsList` | Sí |
| `/appointments/new` | `AppointmentForm` | Sí |
| `/appointments/:id/edit` | `AppointmentForm` | Sí |
| `/settings` | `Settings` | No |
| `/seed` | `SeedPage` | Sí |
| `/account/tenancies` | `MyTenancies` | No |
| `/account/request-tenancy` | `RequestTenancy` | No |

### Rutas Admin (AdminLayout)
| Ruta | Componente | Rol Requerido |
|------|------------|---------------|
| `/admin/tenants` | `TenantsList` | super_admin |
| `/admin/tenants/new` | `TenantForm` | super_admin |
| `/admin/tenants/:id/edit` | `TenantForm` | super_admin |
| `/admin/tenancy-requests` | `TenancyRequestsList` | super_admin |
| `/admin/users` | `UsersList` | tenant_admin |
| `/admin/users/new` | `UserForm` | tenant_admin |
| `/admin/users/:id/edit` | `UserForm` | tenant_admin |

### Lógica de Redirección (RootRedirect)

```
Usuario no autenticado → Landing Page
Super Admin sin tenant → /admin/tenants
Usuario con tenant → /dashboard
Usuario sin tenant → /account/tenancies
```

---

## 🔐 Sistema de Roles

### Jerarquía de Roles

| Rol | Nivel | Permisos |
|-----|-------|----------|
| `super_admin` | 3 | Acceso total, gestión de tenants |
| `tenant_admin` | 2 | Gestión de su tenant y usuarios |
| `staff` | 1 | Operaciones básicas dentro del tenant |

### Custom Attributes en Cognito

- `custom:role` - Rol del usuario
- `custom:tenantId` - UUID del tenant activo
- `custom:tenantName` - Nombre del tenant activo

**IMPORTANTE:** Estos claims solo están en el `id_token`, NO en el `access_token`.

---

## 📁 Estructura del Proyecto

```
smartboxing/
├── backend/
│   ├── package.json
│   ├── scripts/
│   │   ├── clean-demo-data.mjs    # Limpiar datos de demo
│   │   ├── clear-db.mjs           # Limpiar DB
│   │   ├── create-super-admin.mjs # Crear super admin
│   │   ├── create-tenant.mjs      # Crear tenant
│   │   ├── seed.mjs               # Seed de datos (requiere SEED_TENANT)
│   │   └── seed-100-staff.mjs     # Seed masivo
│   └── src/
│       ├── handlers/
│       │   ├── admin/tenants/     # CRUD tenants (super_admin)
│       │   ├── admin/users/       # CRUD usuarios
│       │   ├── analytics/         # Dashboard métricas
│       │   ├── appointments/      # CRUD citas
│       │   ├── boxes/             # CRUD boxes
│       │   ├── deployment/        # Canary hooks
│       │   ├── patients/          # CRUD pacientes
│       │   ├── seed/              # Bulk seed/clear
│       │   ├── settings/          # Config client/user
│       │   ├── staff/             # CRUD staff
│       │   ├── tenancy/           # Solicitudes y switch
│       │   ├── health.js
│       │   └── warmup.js
│       └── lib/
│           ├── auth.js            # Helpers de autenticación
│           ├── chaos.js           # Chaos engineering
│           ├── db.js              # DynamoDB client
│           ├── http.js            # Handler wrapper
│           └── obs.js             # Logging/observability
├── frontend/
│   ├── package.json
│   ├── .env.production            # Variables de entorno
│   └── src/
│       ├── api/
│       │   ├── admin.js           # API admin
│       │   ├── analytics.js       # API analytics
│       │   ├── client.js          # Axios client base
│       │   ├── seed.js            # API seed
│       │   ├── settings.js        # API settings
│       │   └── tenancy.js         # API tenancy
│       ├── auth/
│       │   ├── AuthContext.js
│       │   ├── AuthProvider.jsx
│       │   ├── cognito.js
│       │   ├── cognitoAuth.js
│       │   └── useAuth.js
│       ├── components/
│       │   ├── AdminRoute.jsx
│       │   ├── ProtectedRoute.jsx
│       │   └── layout/
│       │       ├── AdminLayout.jsx
│       │       ├── MainLayout.jsx
│       │       ├── Sidebar.jsx
│       │       └── TenantSelector.jsx
│       └── pages/
│           ├── admin/             # Páginas admin
│           ├── tenancy/           # Páginas tenancy
│           └── ...                # Páginas principales
├── scripts/
│   ├── canary-deploy.mjs
│   ├── canary-monitor.mjs
│   ├── chaos-toggle.mjs
│   ├── create-super-admin.mjs
│   ├── deploy.sh
│   ├── generate-frontend-env.js
│   └── ...
├── serverless.yml                 # Infraestructura IaC
└── package.json
```

---

## 🚀 Comandos de Deploy

### Deploy Completo (Backend + Frontend)
```bash
npx serverless deploy --stage dev
```

### Solo Backend
```bash
cd backend && npx serverless deploy --stage dev
```

### Build Frontend Local
```bash
cd frontend && npm run build
```

### Invalidar Cache CloudFront
```bash
aws cloudfront create-invalidation --distribution-id EAA3OU56GBIPU --paths "/*"
```

---

## 🌱 Seed de Datos

### Requisitos
El seed ahora **REQUIERE** un UUID de tenant válido:

```bash
cd backend
SEED_TENANT=914c345c-31d4-4088-8829-872667dc0fbe \
T_BOXES=smartboxing-Boxes-dev \
T_STAFF=smartboxing-Staff-dev \
T_APPOINTMENTS=smartboxing-Appointments-dev \
npm run db:seed
```

### Crear Super Admin
```bash
node scripts/create-super-admin.mjs moralesmattias@gmail.com Admin1234! dev
```

---

## 🔧 Variables de Entorno Frontend

Archivo: `frontend/.env.production`

```env
VITE_API_BASE_URL=https://ocpzcn4cu6.execute-api.us-east-1.amazonaws.com
VITE_USER_POOL_ID=us-east-1_flcHOKjMy
VITE_USER_POOL_CLIENT_ID=7o3mbd6s94sp7jtb0p300pc4un
VITE_COGNITO_DOMAIN=https://smartboxing-dev.auth.us-east-1.amazoncognito.com
VITE_REDIRECT_URI=https://d3mydfxpimeym.cloudfront.net/callback
VITE_LOGOUT_URI=https://d3mydfxpimeym.cloudfront.net/login
VITE_STAGE=dev
```

---

## 📱 Menú Sidebar

### Siempre Visible
- **Panel Admin** (si es super_admin o tenant_admin)
- **Mis Tenencias**
- **Configuración**

### Solo con Tenant Activo
- Dashboard
- Boxes
- Staff
- Citas

---

## 🐛 Notas Técnicas Importantes

1. **Token de Autenticación**: El frontend usa `id_token` (NO `access_token`) porque los custom claims de Cognito solo están en el id_token.

2. **Multi-Tenant**: Todos los handlers de datos (boxes, staff, appointments, patients) usan `getRequiredTenantId()` que lanza 403 si el usuario no tiene tenant asignado.

3. **Settings**: Los endpoints de settings usan `getOptionalTenantId()` para permitir acceso sin tenant (devuelve defaults).

4. **Solicitudes de Tenencia**: El endpoint GET `/tenancy/requests` soporta `?onlyMine=true` para que el super_admin pueda ver solo sus propias solicitudes en "Mis Tenencias".

5. **Seed Script**: Ya no acepta fallback a `TENANT#demo`. Requiere UUID válido de un tenant existente.

---

## 📅 Historial de Cambios Recientes

- **2025-12-07**: 
  - Limpieza de datos de demo con `TENANT#demo` (33 registros eliminados)
  - Actualización de todos los handlers para requerir tenantId real
  - Eliminación de bucket S3 obsoleto `smartboxing-frontend-prod`
  - Sidebar actualizado: Configuración siempre visible
  - Fix: Mis Solicitudes solo muestra las del usuario actual

---

## 📞 Soporte

**FM IT Solutions**
- Mattias Morales
- Francisco Polo
