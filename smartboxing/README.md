## Fase 0 — Baseline (DONE ✅)

### Completado:
- ✅ `/auth/me` protegido por Cognito (JWT)
- ✅ Tablas y endpoint `/personalization` con merge (cliente + usuario)
- ✅ Semillas de ClientSettings y UserSettings
- ✅ Tablas y seeds de Permissions/Roles/UserRoles + endpoints:
  - ✅ `GET /permissions`
  - ✅ `POST /roles` 
  - ✅ `POST /roles/assign`

### Comandos ejecutados:
```bash
# Variables de entorno configuradas ## Fase 5 — Frontend (mínimos para demo) 🖥️ (DONE ✅)

### 15. Botón "Login con Cognito": ✅ IMPLEMENTADO

✅ **CognitoLoginPage creado** con diseño moderno que redirige a `/oauth2/authorize` (implicit flow)
✅ **Configuración actualizada** en Cognito para permitir callbacks desde localhost:5173
✅ **Login URL generado dinámicamente** con parámetros correctos (client_id, response_type, scope, redirect_uri)

### 16. Callback: ✅ IMPLEMENTADO

✅ **CallbackPage creado** que parsea `#id_token` del fragment (implicit flow)
✅ **Token management** completo con parseJWT, validación de expiración, almacenamiento local
✅ **Auto-redirect** a home después de login exitoso o a login si falla

### 17. .env del front: ✅ CONFIGURADO

```env
VITE_API_BASE=https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com
VITE_COGNITO_DOMAIN=smartboxing.auth.us-east-1.amazoncognito.com  
VITE_COGNITO_CLIENT_ID=14skfnveh2ik2bt31crj6udvv0
VITE_REDIRECT_URI=http://localhost:5173/callback
VITE_LOGOUT_URI=http://localhost:5173/login
```

### 18. Reemplazar llamadas antiguas: ✅ PREPARADO

✅ **serverlessServices.js** creado con todos los endpoints del nuevo backend:
- Auth: `/auth/me`, `/permissions`  
- Personalization: `/personalization` (GET/PUT client/me)
- Business: `/boxes`, `/doctors`, `/specialties`, `/vacations`, `/box-assignments`, `/appointments`
- Autorización automática con Bearer token en headers

✅ **Arquitectura de autenticación nueva:**
- CognitoAuthContext con gestión completa de tokens JWT
- CognitoProtectedRoute para rutas protegidas
- Auto-refresh y validación de expiración  
- ParseJWT y extracción de claims (sub, email, tenantId)

✅ **Mantenimiento de compatibilidad:**
- App.jsx original intacto (Django backend)
- CognitoApp.jsx nuevo (Serverless backend) 
- Cambio simple en index.html para usar cognitoMain.jsx

**Frontend ejecutándose:**
```bash
cd smartboxing/frontend
npm install
npm run dev
# Disponible en http://localhost:5173/
```

**URLs de Cognito configuradas:**
- Login: https://smartboxing.auth.us-east-1.amazoncognito.com/login?...
- Logout: https://smartboxing.auth.us-east-1.amazoncognito.com/logout?...  
- Callbacks permitidos: localhost:5173/callback, CloudFront production

**Flujo de autenticación:**
1. Usuario accede a localhost:5173
2. Si no autenticado → redirige a /login
3. Click botón → redirige a Cognito Hosted UI
4. Login exitoso → redirige a localhost:5173/callback#id_token=...
5. CallbackPage extrae token, valida, guarda, redirige a /
6. ProtectedRoute permite acceso a rutas internascat .env | grep -v '^#' | xargs)

# Deploy inicial
serverless deploy

# Sembrar datos de autenticación y permisos
node scripts/seed-auth.cjs
node scripts/seed.cjs

# Prueba de endpoints
curl -sS -H "Authorization: Bearer $ID_TOKEN" \
  https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/permissions | jq .

curl -sS -H "Authorization: Bearer $ID_TOKEN" \
  https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/auth/me | jq .

curl -sS -H "Authorization: Bearer $ID_TOKEN" \
  https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/personalization | jq .
```

## Fase 1 — Infraestructura (tablas de negocio + IAM) 🔧 (DONE ✅)

### Completado:
- ✅ **8 Tablas DynamoDB de negocio creadas:**
  - Equipment (name HASH)
  - Boxes (id HASH; GSI OSIndex { HASH: operational_status, RANGE: number })
  - BoxEquipment (boxKey HASH, eqKey RANGE) — relación N:M
  - Specialties (id HASH)
  - Doctors (id HASH)
  - Vacations (id HASH; GSI VacationsByDoctor { HASH: doctorId, RANGE: start_date })
  - BoxAssignments (id HASH; 3 GSIs: AssignmentsByDoctor, AssignmentsByBox, AssignmentsByDate)
  - Appointments (id HASH; 3 GSIs: ApptByAssignment, ApptByDate, ApptByDoctorDate)

### Comandos ejecutados:
```bash
# Deploy con nuevas tablas
serverless deploy

# Verificar tablas creadas
aws dynamodb list-tables --query 'TableNames[?contains(@, `smartboxing-node`)]' --output table

# Sembrar datos de negocio
node scripts/seed-business.cjs
```

## Fase 2 — Endpoints de negocio (mantén contrato del front) 🧩 (DONE ✅)

### 4. Boxes (DONE ✅)

✅ **Endpoints implementados y funcionando:**
- `GET /boxes` (listado; filtros: operational_status, search, hallway)
- `GET /boxes/{id}` 
- `POST /boxes` (crear) — requiere boxes:write
- `PUT /boxes/{id}` (actualizar) — boxes:write
- `DELETE /boxes/{id}` — boxes:write

**Pruebas realizadas:**
```bash
# Listar todas las boxes
curl -sS -H "Authorization: Bearer $ID_TOKEN" \
  https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/boxes | jq .

# Filtrar por estado
curl -sS -H "Authorization: Bearer $ID_TOKEN" \
  "https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/boxes?operational_status=ACTIVE" | jq .

# Obtener box específica
curl -sS -H "Authorization: Bearer $ID_TOKEN" \
  https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/boxes/box-001 | jq .

# Crear nueva box
curl -sS -X POST -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "box-004", "name": "Pediatría 1", "number": 301, "operational_status": "ACTIVE"}' \
  https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/boxes | jq .

# Actualizar box
curl -sS -X PUT -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description": "Descripción actualizada"}' \
  https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/boxes/box-004 | jq .
```

### 5. Doctors y Specialties (DONE ✅)

✅ **Endpoints implementados:**

**Specialties:**
- `GET /specialties` — doctors:read

**Doctors:**  
- `GET /doctors` (filtros: status=ON_DUTY|ON_VACATION|AVAILABLE, search) — doctors:read
- `POST /doctors` — doctors:write
- `PUT /doctors/{id}` — doctors:write  
- `DELETE /doctors/{id}` — doctors:write

**Pruebas a realizar (con token válido):**
```bash
# Listar especialidades
curl -sS -H "Authorization: Bearer $ID_TOKEN" \
  https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/specialties | jq .

# Listar doctores
curl -sS -H "Authorization: Bearer $ID_TOKEN" \
  https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/doctors | jq .

# Filtrar doctores por estado  
curl -sS -H "Authorization: Bearer $ID_TOKEN" \
  "https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/doctors?status=ON_DUTY" | jq .

# Crear nuevo doctor
curl -sS -X POST -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "doc-004", "name": "Dr. Ana Martínez", "email": "ana@hospital.com", "specialty_id": "spec-001"}' \
  https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/doctors | jq .
```

### 6. Vacations (DONE ✅)

✅ **Endpoints implementados:**
- `GET /vacations?doctor=<id>` (GSI VacationsByDoctor) — doctors:read
- `POST /vacations` — doctors:write  
- `DELETE /vacations/{id}` — doctors:write

**Datos sembrados:**
```bash
node scripts/seed-vacations.cjs
```

**Pruebas a realizar (con token válido):**
```bash
# Listar todas las vacaciones
curl -sS -H "Authorization: Bearer $ID_TOKEN" \
  https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/vacations | jq .

# Listar vacaciones de un doctor específico
curl -sS -H "Authorization: Bearer $ID_TOKEN" \
  "https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/vacations?doctor=doc-003" | jq .

# Crear nueva vacación
curl -sS -X POST -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "vac-003", "doctorId": "doc-002", "start_date": "2025-11-01", "end_date": "2025-11-07", "reason": "Vacaciones"}' \
  https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/vacations | jq .
```

### 7. BoxAssignments (DONE ✅)

✅ **Endpoints implementados con validaciones avanzadas:**
- `GET /box-assignments?box=<id>|doctor=<id>|on_date=YYYY-MM-DD` — assignments:read
- `POST /box-assignments` — assignments:write (con validación anti-solapamiento)
- `PUT /box-assignments/{id}` — assignments:write (con validación anti-solapamiento)
- `DELETE /box-assignments/{id}` — assignments:write

✅ **Validaciones implementadas:**
- Campo `date` derivado automáticamente de `start_time`
- Validación de solapamiento de boxes (mismo box no puede tener 2 assignments simultáneas)
- Validación de solapamiento de doctors (mismo doctor no puede estar en 2 boxes simultáneamente)
- Uso correcto de GSIs para consultas eficientes

**Datos sembrados:**
```bash
node scripts/seed-assignments.cjs
```

**Pruebas realizadas exitosamente:**
```bash
# Listar todas las asignaciones
curl -sS -H "Authorization: Bearer $ID_TOKEN" \
  https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/box-assignments | jq .

# Filtrar por box específica
curl -sS -H "Authorization: Bearer $ID_TOKEN" \
  "https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/box-assignments?box=box-001" | jq .

# Filtrar por doctor
curl -sS -H "Authorization: Bearer $ID_TOKEN" \
  "https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/box-assignments?doctor=doc-002" | jq .

# Crear asignación válida
curl -sS -X POST -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "assign-004", "boxId": "box-003", "doctorId": "doc-004", "start_time": "2025-09-29T14:00:00Z", "end_time": "2025-09-29T18:00:00Z"}' \
  https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/box-assignments | jq .

# Probar validación de conflictos (devuelve 409)
curl -sS -X POST -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "assign-005", "boxId": "box-003", "doctorId": "doc-002", "start_time": "2025-09-29T16:00:00Z", "end_time": "2025-09-29T20:00:00Z"}' \
  https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/box-assignments | jq .
```

### 8. Appointments (DONE ✅)

✅ **Endpoints implementados con validaciones avanzadas:**
- `GET /appointments?assignment=<id>|date=YYYY-MM-DD|doctor=<id>` — appointments:read
- `GET /appointments/{id}` — appointments:read
- `POST /appointments` — appointments:write (con validación de slots 30 min y anti-solapamiento)
- `PUT /appointments/{id}` — appointments:write (con validación de slots 30 min y anti-solapamiento)
- `DELETE /appointments/{id}` — appointments:write

✅ **Validaciones implementadas:**
- Duración exacta de 30 minutos
- Horarios válidos (:00 o :30 minutos solamente)
- Citas dentro del rango de tiempo del assignment
- Validación de solapamiento (mismo assignment no puede tener citas simultáneas)
- Herencia automática de boxId, doctorId, specialtyId desde el assignment
- Campo `date` derivado automáticamente de `start_time`
- Uso correcto de GSIs (ApptByAssignment, ApptByDate, ApptByDoctorDate) para consultas eficientes

**Datos sembrados:**
```bash
node scripts/seed-appointments.cjs
```

**Pruebas realizadas exitosamente:**
```bash
# Listar todas las citas
curl -sS -H "Authorization: Bearer $ID_TOKEN" \
  https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/appointments | jq .

# Filtrar por assignment
curl -sS -H "Authorization: Bearer $ID_TOKEN" \
  "https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/appointments?assignment=assign-001" | jq .

# Filtrar por fecha
curl -sS -H "Authorization: Bearer $ID_TOKEN" \
  "https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/appointments?date=2025-09-30" | jq .

# Filtrar por doctor
curl -sS -H "Authorization: Bearer $ID_TOKEN" \
  "https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/appointments?doctor=doc-002" | jq .

# Obtener cita específica
curl -sS -H "Authorization: Bearer $ID_TOKEN" \
  https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/appointments/appt-001 | jq .

# Crear cita válida
curl -sS -X POST -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "appt-008", "assignmentId": "assign-001", "start_time": "2025-09-29T11:00:00Z", "end_time": "2025-09-29T11:30:00Z", "patient_name": "Roberto Silva", "reason": "Consulta"}' \
  https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/appointments | jq .

# Probar validaciones (devuelve 400 con mensajes específicos)
curl -sS -X POST -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "test", "assignmentId": "assign-001", "start_time": "2025-09-29T12:15:00Z", "end_time": "2025-09-29T12:45:00Z", "patient_name": "Test"}' \
  https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/appointments | jq .

# Actualizar cita
curl -sS -X PUT -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Actualizado"}' \
  https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/appointments/appt-008 | jq .
```

### 9. Reportes (PENDIENTE)

## Fase 3 — Autorización efectiva por endpoint (mínimo privilegio) 🔐 (DONE ✅)

### 10. En cada handler de negocio: ✅ IMPLEMENTADO

Obtén claims + tenantId (custom:tenantId o "demo").

const { userPermissions, requirePerm } = require("../../lib/authz.js")

const perms = await userPermissions(tenantId, claims.sub)

requirePerm(perms, "<perm:read|write>")

### 11. Mapa implementado: ✅

Boxes → boxes:read / boxes:write

Doctors/Specialties/Vacations → doctors:read / doctors:write

Assignments → assignments:read / assignments:write

Appointments → appointments:read / appointments:write

Roles/Permisos → settings:write, users:assignRoles

### 12. Seeds de roles (ya cargados): ✅

admin: todos los permisos.

scheduler: read + write de assignments y appointments.

viewer: solo read.

### 13. Pruebas de autorización: ✅ VALIDADO

✅ **Rol "viewer" probado exitosamente:**
- Operaciones READ permitidas: ✅ boxes, appointments, doctors, assignments
- Operaciones WRITE bloqueadas: ❌ POST/PUT/DELETE devuelven 403 Forbidden

✅ **Rol "scheduler" probado exitosamente:**
- Appointments CRUD: ✅ Permitido (creó appt test-scheduler-appt)
- Assignments CRUD: ✅ Permitido (creó assignment test-scheduler-assign)
- Boxes CRUD: ❌ Bloqueado (403 Forbidden)
- Doctors CRUD: ❌ Bloqueado (403 Forbidden)

✅ **Rol "admin" restaurado para demos**

**Scripts de prueba creados:**
```bash
# Cambiar a viewer (solo lectura)
node scripts/assign-viewer-role.cjs

# Cambiar a scheduler (assignments + appointments)
node scripts/assign-scheduler-role.cjs

# Restaurar admin (todos los permisos)
node scripts/restore-admin-role.cjs
```

**Comandos de prueba ejecutados:**
```bash
# Como viewer - operaciones READ funcionan
curl -sS -H "Authorization: Bearer $ID_TOKEN" \
  https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/boxes | jq .

# Como viewer - operaciones WRITE fallan (403)
curl -sS -X POST -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "test", "name": "Test"}' \
  https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/boxes | jq .

# Como scheduler - appointments funcionan
curl -sS -X POST -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "test-appt", "assignmentId": "assign-001", "start_time": "2025-09-29T13:00:00Z", "end_time": "2025-09-29T13:30:00Z", "patient_name": "Test"}' \
  https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/appointments | jq .

# Como scheduler - boxes fallan (403)
curl -sS -X POST -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "test", "name": "Test"}' \
  https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/boxes | jq .
```

## Fase 4 — Personalización (update) 🎨 (DONE ✅)

### 13. Endpoints de update: ✅ IMPLEMENTADOS

✅ **PUT /personalization/client** — guarda/actualiza ClientSettings (permiso settings:write)
✅ **PUT /personalization/me** — guarda/actualiza UserSettings del sub actual (sin permisos especiales)

Ambos validan JWT y usan tenantId/userSub desde claims correctamente.

**Estructura de datos corregida:**
- Client settings anidados en `.settings`
- User settings anidados en `.settings`  
- Merge correcto en GET /personalization

**Validaciones implementadas:**
- Client settings requiere permiso `settings:write` (solo admin)
- User settings libre para cualquier usuario autenticado
- Estructura de datos consistente con seeds originales
- Campos requeridos validados

**Pruebas realizadas exitosamente:**
```bash
# Actualizar configuraciones de cliente (solo admin)
curl -sS -X PUT -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"brandText": "Updated", "primaryColor": "#dc2626", "secondaryColor": "#991b1b"}' \
  https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/personalization/client | jq .

# Actualizar configuraciones de usuario (cualquier usuario)
curl -sS -X PUT -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"theme": "light", "language": "es-ES", "dateFormat": "DD/MM/YYYY", "dashboardCards": ["appointments", "boxes"]}' \
  https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/personalization/me | jq .

# Verificar merge correcto
curl -sS -H "Authorization: Bearer $ID_TOKEN" \
  https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/personalization | jq .

# Probar autorización (como viewer, client settings falla)
node scripts/assign-viewer-role.cjs
curl -sS -X PUT -H "Authorization: Bearer $ID_TOKEN" \
  -d '{"primaryColor": "#000"}' \
  https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com/personalization/client | jq .
```

### 14. Front (sin refactor grande): ✅ READY

Consumir GET /personalization al cargar app, aplicar colores/branding/fecha/hora.

Persistir token del Hosted UI y adjuntarlo en Authorization: Bearer <id_token> en cada fetch.

Manejar 401 → redirigir a Hosted UI login.

**APIs preparadas para el frontend:**
- GET /personalization (merge cliente + usuario)
- PUT /personalization/client (admin solo)
- PUT /personalization/me (cualquier usuario)

## Fase 5 — Frontend (mínimos para demo) 🖥️

### 15. Botón “Login con Cognito”: link a tu /oauth2/authorize (code flow o implicit).

### 16. Callback: parsear #id_token (implicit) o intercambiar code → tokens (code flow) en un pequeño endpoint (si usas secreto) o en el front con PKCE (si haces público el client).

### 17. .env del front:

VITE_API_BASE=https://<api-id>.execute-api.us-east-1.amazonaws.com

VITE_COGNITO_DOMAIN=...

VITE_COGNITO_CLIENT_ID=...

VITE_REDIRECT_URI=...

### 18. Reemplazar llamadas antiguas de Django por las nuevas rutas (mismo contrato JSON si lo mantuviste).

## Fase 6 — Validación de la rúbrica ✅

### 19. Login SaaS + JWT: Cognito Hosted UI, id_token → prueba /auth/me.

### 20. Vigencia < 5 min:

En App client configura ID token (y Access si quieres) a 5 min.

Verifica con exp - iat.

(Opcional) aplica jwtGuard en handlers para reforzar (rechazar tokens con iat > 4 min).

### 21. Repositorio de permisos disponibles: /permissions devuelve lista (sembrada).

### 22. Gestión de roles: POST /roles, POST /roles/assign.

### 23. Mínimo privilegio: demuéstralo con un usuario viewer (403 en write).

### 24. Personalización SaaS:

GET /personalization (merge tenant + user).

PUT /personalization/client y PUT /personalization/me.

Desacople: tablas separadas ClientSettings/UserSettings.

## Fase 7 — Pulido final 🧽

### 25. Estandariza respuestas de error ({ message, code }) y logs (console.error con requestId).

### 26. CORS ya está en httpApi.cors: true; verifica headers en front.

### 27. README con:

pre-requisitos (Node 20, AWS creds, UserPool/Client IDs)

serverless deploy

seed auth + seed personalization + migración

URLs de prueba y curl listos

### 28. Backups: exporta tablas clave a JSON (CLI) por si necesitas reinicializar.