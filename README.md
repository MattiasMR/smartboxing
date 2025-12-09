# SmartBoxing

Sistema SaaS multi-tenant para la gestion de espacios fisicos (boxes) y citas, orientado a clinicas, gimnasios, centros de rehabilitacion y organizaciones similares. Construido con arquitectura serverless sobre AWS.

---

## Descripcion General

SmartBoxing permite a multiples organizaciones (tenants) gestionar de forma independiente sus espacios fisicos reservables, personal, pacientes y citas. Cada organizacion tiene sus datos completamente aislados, con roles diferenciados para administradores de sistema, administradores de organizacion y personal operativo.

El sistema no esta atado a un tipo especifico de negocio. Puede usarse para centros medicos, gimnasios, estudios de yoga, centros de kinesiologia o cualquier organizacion que necesite administrar espacios y agendar citas.

---

## Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Instalacion y Deploy](#instalacion-y-deploy)
- [Arquitectura Multi-Tenant](#arquitectura-multi-tenant)
- [Roles y Permisos](#roles-y-permisos)
- [Flujos de Usuario](#flujos-de-usuario)
- [API Reference](#api-reference)
- [Stack Tecnologico](#stack-tecnologico)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Desarrollo Local](#desarrollo-local)
- [Testing](#testing)
- [CI/CD](#cicd)
- [Seguridad](#seguridad)
- [Costos Estimados](#costos-estimados)
- [Troubleshooting](#troubleshooting)

---

## Requisitos Previos

- Node.js 22 o superior
- npm (incluido con Node.js)
- AWS CLI configurado
- Cuenta AWS (AWS Academy o cuenta personal)
- Serverless Framework 4 instalado globalmente:
  ```bash
  npm install -g serverless
  ```

---

## Instalacion y Deploy

### Primer Deploy

```bash
# Clonar repositorio
git clone https://github.com/MattiasMR/smartboxing.git
cd smartboxing

# Instalar dependencias
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Configurar credenciales AWS
# Para AWS Academy (incluye session token):
export AWS_ACCESS_KEY_ID=tu_access_key_id
export AWS_SECRET_ACCESS_KEY=tu_secret_access_key
export AWS_SESSION_TOKEN=tu_session_token

# Para cuenta AWS personal:
export AWS_ACCESS_KEY_ID=tu_access_key_id
export AWS_SECRET_ACCESS_KEY=tu_secret_access_key

# Verificar credenciales
aws sts get-caller-identity

# Deploy completo (backend + frontend)
# Tiempo estimado: 8-12 minutos
sls deploy
```

Al finalizar el deploy, la consola mostrara las URLs del API Gateway y CloudFront.

### Eliminar Recursos

```bash
# Eliminar stack completo
sls remove

# Si quedan buckets S3 con contenido, vaciarlos primero:
aws s3 rm s3://smartboxing-frontend-dev-v2 --recursive
aws s3 rb s3://smartboxing-frontend-dev-v2 --force
```

---

## Arquitectura Multi-Tenant

## Roles y Permisos

### super_admin
- Gestiona el sistema completo
- Crea, edita y elimina tenants
- Revisa y aprueba/rechaza solicitudes de tenencia
- Accede a metricas globales

### tenant_admin
- Administra una o varias organizaciones
- Gestiona usuarios dentro de su tenant
- Configura parametros del tenant (branding, horarios, etc.)
- Opera recursos: boxes, staff, citas, pacientes

---

## Flujos de Usuario

### Registro de Nueva Organizacion

1. Usuario se registra en `/register`
2. Sistema crea cuenta en Cognito sin tenant asignado
3. Usuario es redirigido a `/account/tenancies`
4. Usuario solicita crear organizacion en `/account/request-tenancy`
5. super_admin revisa y aprueba la solicitud
6. Sistema crea el tenant y asigna al usuario como tenant_admin
7. Usuario puede ingresar al tenant desde `/account/tenancies`

### Cambio de Tenant Activo

1. Usuario con multiples tenencias accede a `/account/tenancies`
2. Selecciona "Ingresar" en el tenant deseado
3. Sistema actualiza claims de Cognito via `/tenancy/switch`
4. Usuario es redirigido al dashboard del tenant seleccionado

### Creacion de Usuarios por tenant_admin

1. tenant_admin accede a `/admin/users` (dentro del Mis Tenencias y Gestionar Usuarios)
2. Crea usuario con nombre, email y rol
3. Sistema crea usuario en Cognito y lo asocia al tenant activo
4. Nuevo usuario puede iniciar sesion inmediatamente

---

## API Reference

### Endpoints Publicos

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /health | Health check del sistema |
| GET | /tenants | Lista tenants disponibles (registro) |
| GET | /canary/evaluate | Evalua feature flags |

### Recursos de Negocio (requieren JWT + tenantId)

#### Boxes
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /boxes | Lista boxes del tenant |
| GET | /boxes/{id} | Detalle de un box |
| POST | /boxes | Crea box |
| PUT | /boxes/{id} | Actualiza box |
| DELETE | /boxes/{id} | Elimina box |

#### Staff
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /staff | Lista staff del tenant |
| GET | /staff/{id} | Detalle de staff member |
| POST | /staff | Crea staff member |
| PUT | /staff/{id} | Actualiza staff member |
| DELETE | /staff/{id} | Elimina staff member |

#### Appointments
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /appointments | Lista citas del tenant |
| GET | /appointments/{id} | Detalle de cita |
| POST | /appointments | Crea cita |
| PUT | /appointments/{id} | Actualiza cita |
| DELETE | /appointments/{id} | Elimina cita |

#### Patients
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /patients | Lista pacientes del tenant |
| GET | /patients/{id} | Detalle de paciente |
| POST | /patients | Crea paciente |
| PUT | /patients/{id} | Actualiza paciente |
| DELETE | /patients/{id} | Elimina paciente |

### Configuracion

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /settings/client | Configuracion del tenant |
| PUT | /settings/client | Actualiza configuracion |
| GET | /settings/user | Preferencias del usuario |
| PUT | /settings/user | Actualiza preferencias |
| POST | /settings/upload-logo | Obtiene presigned URL para logo |

### Analytics

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /analytics/dashboard | Metricas del tenant |
| POST | /analytics/ai-report | Genera reporte con IA (requiere OpenAI key) |

### Tenancy Management

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /tenancy/requests | Crea solicitud de tenencia |
| GET | /tenancy/requests | Lista solicitudes |
| POST | /tenancy/requests/{id}/review | Aprueba/rechaza solicitud |
| GET | /tenancy/my-tenants | Lista tenencias del usuario |
| POST | /tenancy/switch | Cambia tenant activo |

### Admin - Tenants (super_admin)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /admin/tenants | Lista todos los tenants |
| GET | /admin/tenants/{id} | Detalle de tenant |
| POST | /admin/tenants | Crea tenant |
| PUT | /admin/tenants/{id} | Actualiza tenant |
| DELETE | /admin/tenants/{id} | Elimina tenant |

### Admin - Users (tenant_admin/super_admin)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /admin/users | Lista usuarios |
| GET | /admin/users/{id} | Detalle de usuario |
| POST | /admin/users | Crea usuario |
| PUT | /admin/users/{id} | Actualiza usuario |
| DELETE | /admin/users/{id} | Elimina usuario |

### Feature Flags (Canary)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /canary/flags | Lista feature flags |
| GET | /canary/flags/{flagName} | Detalle de flag |
| POST | /canary/flags | Crea/actualiza flag |
| PATCH | /canary/flags/{flagName}/rollout | Actualiza rollout |
| POST | /canary/flags/{flagName}/rollback | Rollback de flag |
| DELETE | /canary/flags/{flagName} | Elimina flag |

---

## Stack Tecnologico

### Backend
- Runtime: Node.js 22
- Framework: Serverless Framework 4
- API: AWS API Gateway HTTP v2 + Lambda
- Base de datos: DynamoDB (PAY_PER_REQUEST)
- Autenticacion: AWS Cognito (JWT)
- Validacion: Zod
- Almacenamiento: S3 + CloudFront
- Observabilidad: AWS Lambda Powertools

### Frontend
- Framework: React 19
- Build: Vite 7
- Routing: React Router 7
- Estado servidor: TanStack Query 5
- Formularios: React Hook Form + Zod
- Graficos: Recharts
- Estilos: CSS con variables custom

### Infraestructura
- VPC con subnets publicas y privadas
- VPC Endpoints para DynamoDB y S3 (gateway, sin costo)
- VPC Endpoint para Cognito IDP (interface)
- Security Groups restrictivos
- Network ACLs
- VPC Flow Logs para auditoria
- CloudWatch Alarms para monitoreo

---

## Estructura del Proyecto

```
smartboxing/
├── backend/
│   ├── src/
│   │   ├── handlers/
│   │   │   ├── admin/          # Gestion de tenants y usuarios
│   │   │   ├── analytics/      # Dashboard y reportes IA
│   │   │   ├── appointments/   # CRUD de citas
│   │   │   ├── boxes/          # CRUD de boxes
│   │   │   ├── deployment/     # Feature flags (canary)
│   │   │   ├── patients/       # CRUD de pacientes
│   │   │   ├── seed/           # Datos de prueba
│   │   │   ├── settings/       # Configuracion
│   │   │   ├── staff/          # CRUD de staff
│   │   │   └── tenancy/        # Gestion de tenencias
│   │   └── lib/
│   │       ├── auth.js         # Autorizacion multi-tenant
│   │       ├── db.js           # Cliente DynamoDB
│   │       ├── http.js         # Wrapper de handlers
│   │       └── obs.js          # Observabilidad
│   └── scripts/                # Scripts de mantenimiento
├── frontend/
│   └── src/
│       ├── api/                # Clientes de API
│       ├── auth/               # Contexto y hooks de auth
│       ├── components/         # Componentes reutilizables
│       ├── hooks/              # Custom hooks
│       ├── pages/              # Paginas de la app
│       │   ├── admin/          # Paginas de admin
│       │   ├── analytics/      # Reportes y AI
│       │   └── tenancy/        # Gestion de tenencias
│       └── styles/             # Estilos globales
├── scripts/                    # Scripts de deploy y monitoreo
├── docs/                       # Documentacion adicional
└── serverless.yml              # Configuracion de infraestructura
```

---

## Desarrollo Local

### Frontend

```bash
cd frontend
npm run dev
# Disponible en http://localhost:5173
```

### Logs del Backend

```bash
# Ver logs en tiempo real
sls logs -f listBoxes --tail

# Logs de la ultima hora
sls logs -f createAppointment --startTime 1h

# Invocar funcion localmente
sls invoke local -f health
```

### Scripts de Base de Datos

```bash
cd backend

# Limpiar datos
npm run db:clear

# Cargar datos de prueba
npm run db:seed

# Reset completo
npm run db:reset
```

---

## Testing

### Backend

```bash
cd backend
npm test                    # Todos los tests
npm run test:security       # Tests de seguridad OWASP
npm run test:coverage       # Con reporte de cobertura
```

### Frontend

```bash
cd frontend
npm test                    # Todos los tests
npm run test:a11y           # Tests de accesibilidad
npm run test:coverage       # Con reporte de cobertura
```

---

## CI/CD

### Development

Push a `main` dispara deploy automatico al stage `dev`:

```bash
git push origin main
```

### Production

Deploy manual via GitHub Actions con canary progresivo:
1. Ir a Actions en GitHub
2. Seleccionar workflow "Deploy SmartBoxing"
3. Ejecutar con `stage: prod`
4. El canary avanza 10% -> 50% -> 100%
5. Rollback automatico si hay errores

### Monitoreo de Deploy

```bash
node scripts/canary-monitor.mjs --stage=prod --timeout=20
```

---

## Seguridad

### VPC y Networking

- Lambdas ejecutan en subnets privadas
- Acceso a DynamoDB y S3 via VPC Endpoints (sin internet)
- Cognito accesible via VPC Endpoint interface
- Security Groups permiten solo HTTPS saliente
- Network ACLs como capa adicional

### Autenticacion

- Cognito User Pool con MFA opcional
- Tokens JWT con custom claims para role y tenantId
- Password policy: 8+ caracteres, mayusculas, minusculas, numeros
- Frontend usa id_token (contiene custom claims)

### CloudWatch Alarms

- Error rate > 5 en 2 minutos
- Latencia p99 > 3000ms
- Alertas via SNS

---

## Costos Estimados

Con trafico bajo (desarrollo/staging):

| Servicio | Costo Mensual |
|----------|---------------|
| DynamoDB | $0-2 USD |
| Lambda | Free tier (1M req/mes) |
| S3 | ~$0.50 USD |
| CloudFront | ~$0-1 USD |
| API Gateway | ~$3.50/millon requests |
| Cognito | Free tier (50K MAU) |
| VPC Endpoints | ~$7-14 USD (interface endpoint) |
| **Total** | **$10-20 USD/mes** |

---

## Troubleshooting

### Credenciales AWS expiradas (AWS Academy)

Las credenciales de AWS Academy expiran cada 4 horas:

```bash
# Obtener nuevas credenciales del Learner Lab
export AWS_ACCESS_KEY_ID=nueva_key
export AWS_SECRET_ACCESS_KEY=nueva_secret
export AWS_SESSION_TOKEN=nuevo_token
```

### Error "Stack does not exist"

Es el primer deploy o el stack fue eliminado. Ejecutar `sls deploy` normalmente.

### Frontend no carga despues del deploy

CloudFront puede tardar 5-10 minutos en propagar cambios. Esperar o invalidar cache:

```bash
aws cloudfront create-invalidation --distribution-id DIST_ID --paths "/*"
```

### Lambda timeout conectando a Cognito

Verificar que el VPC Endpoint de Cognito este activo y que el Security Group permita trafico HTTPS.

---

## Licencia

MIT License

---

Version: 2.0 | Ultima actualizacion: Diciembre 2025
