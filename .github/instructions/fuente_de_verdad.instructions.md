---
applyTo: '**'
---
Te dejo directamente el **prompt listo para copiar/pegar** y mandárselo a tu agente de código. Al final agrego una mini nota por si quieres adaptarlo.

---

## PROMPT PARA AGENTE DE CÓDIGO (SMARTBOXING)

Quiero que actúes como un agente de código experto en **SaaS multi-tenant sobre AWS (Lambda, API Gateway, DynamoDB, Cognito, React SPA)** y me ayudes a **pulir y evolucionar la lógica de negocio y los flujos de usuario** de mi sistema llamado **SmartBoxing**.

Tu foco debe estar en:

* Entender y respetar el diseño **multi-tenant**.
* Corregir y mejorar los **flujos funcionales** (onboarding, tenencias, navegación).
* Ajustar la **UI/UX** para que refleje correctamente los flujos de negocio.
* Minimizar cambios innecesarios en infraestructura y código ya estable.

A continuación te detallo el contexto actual y luego los **requerimientos funcionales y de UX** que quiero que implementes.

---

### 1. Contexto general del producto

**SmartBoxing** es un SaaS multi-tenant para la **gestión de espacios físicos (“boxes”)** y su operación diaria:

* Se usa en organizaciones que tienen recursos físicos reservables: **centros médicos, gimnasios, clínicas, centros de rehabilitación, etc.**
* Cada organización es un **tenant** aislado:

  * Sus datos (boxes, staff, pacientes, citas, configuración) están separados por `tenantId`.
  * Un usuario puede pertenecer a **uno o varios tenants**.

**Idea central de negocio:**

* El sistema no es “para un hospital” en particular, sino un **“gestor de boxes/espacios físicos para múltiples organizaciones”**.
* Un “tenant” representa esa organización (ej: Clínica X, Gimnasio Y, Centro Kinésico Z).

---

### 2. Arquitectura muy resumida (solo para contexto)

No quiero que te centres en esto, pero lo necesitas como referencia mínima:

* **Frontend:**

  * React SPA servida en S3 + CloudFront.
  * Rutas públicas y protegidas, layouts `MainLayout` y `AdminLayout`.

* **Backend:**

  * AWS Lambda + API Gateway HTTP v2.
  * DynamoDB como base de datos.
  * Cognito User Pool para autenticación y roles (custom claims en `id_token`).

* **Multi-tenant:**

  * Todas las tablas core tienen `tenantId` como partition key (ej: `Boxes`, `Staff`, `Appointments`, `Patients`).
  * Tablas de multi-tenancy: `Tenants`, `TenantUsers`, `TenancyRequests`.
  * Endpoints de negocio protegidos exigen un `tenantId` activo (obtenido desde los claims / contexto de sesión). 

No cambies nombres de tablas ni endpoints salvo que sea estrictamente necesario; ajusta la lógica y la UX encima de lo que ya existe.

---

### 3. Roles de usuario y significado de negocio

Los roles principales son:

1. **super_admin**

   * Propósito de negocio: operar el SaaS a nivel global.
   * Puede:

     * Gestionar **tenants** globalmente (crear, listar, editar, borrar).
     * Revisar y aprobar/rechazar **solicitudes de tenencia**.
     * Ver métricas globales (analytics).

2. **tenant_admin**

   * Propósito de negocio: es el **administrador de una organización/tenant**.
   * Responsabilidades:

     * Gestionar **su** tenant: configuración, branding, etc.
     * Gestionar **usuarios de su tenant** (crearlos, asignar roles).
     * Operar los recursos de su tenencia: boxes, staff, pacientes, citas, etc.
   * Importante: un mismo usuario puede ser tenant_admin en **más de una tenencia**.

3. **staff**

   * Propósito de negocio: perfil operativo dentro de un tenant (ej: médico, entrenador, recepcionista).
   * Responsabilidades:

     * Gestionar agenda, citas, pacientes, uso de boxes, dentro de la tenencia a la que pertenece.
   * No administra usuarios ni configuración de tenant.

4. **Usuario autenticado sin tenencias activas**

   * Puede estar recién registrado o ser alguien que aún no tiene ninguna tenencia aprobada.
   * Su espacio principal es la vista **“Mis Tenencias”** y las pantallas de solicitud de tenencia.

---

### 4. Rutas y endpoints relevantes existentes (nivel conceptual)

#### 4.1. Rutas públicas (frontend)

* `/` → Landing / RootRedirect
* `/login` → Login con Cognito
* `/register` → Registro de usuario (a mejorar)

#### 4.2. Rutas protegidas principales

* `/dashboard` → Dashboard del tenant activo (requiere tenant)
* `/boxes`, `/boxes/new`, `/boxes/:id/edit`
* `/staff`, `/staff/new`, `/staff/:id/edit`
* `/appointments`, `/appointments/new`, `/appointments/:id/edit`
* `/settings` → Configuración (tenant y/o usuario)
* `/account/tenancies` → **Mis Tenencias**
* `/account/request-tenancy` → Solicitar Tenencia

#### 4.3. Rutas admin

* `/admin/tenants` y `/admin/tenants/*` → gestión de tenants (super_admin)
* `/admin/tenancy-requests` → revisión de solicitudes (super_admin)
* `/admin/users` y `/admin/users/*` → gestión de usuarios de un tenant (tenant_admin)

#### 4.4. Endpoints de API importantes (solo concepto)

* CRUD `Boxes`, `Staff`, `Appointments`, `Patients` (requieren `tenantId`).
* `/tenancy/requests` (crear/listar solicitudes).
* `/tenancy/my-tenants` (listar tenencias de un usuario).
* `/tenancy/switch` (cambiar tenant activo).
* Endpoints admin de tenants y admin de users.
* Endpoints de settings (client y user).

---

### 5. Flujo de negocio deseado (visión funcional)

Quiero que el sistema funcione **así** desde el punto de vista de negocio y usuario.

#### 5.1. Experiencia pública (usuario no autenticado)

**Objetivo:** que en desktop y móvil siempre exista un camino claro para **Iniciar sesión** o **Crear cuenta**.

* La **Landing/Root** debe:

  * Mostrar claramente botones:

    * “Iniciar sesión” → `/login`
    * “Crear cuenta” → `/register`
  * En **móvil**, el **header** debe incluir SIEMPRE un acceso visible a “Iniciar sesión”.

    * Ejemplo: botón/ícono con texto “Login” o “Iniciar sesión” en la parte superior (no escondido solo en el sidebar).

> Requisito UX 1: En mobile, el usuario debe poder encontrar “Iniciar sesión” sin hacer scroll ni abrir menús poco evidentes.

---

#### 5.2. Flujo “Crear cuenta” (Registro de tenant_admin estándar)

**Contexto:** El formulario de `/register` es para usuarios que, en la práctica, serán **tenant_admins** de una organización.

**Requerimientos:**

1. **No quiero que se hable de “hospital”** en este flujo.

   * Este SaaS es para gestionar **espacios físicos** en general (clínicas, gimnasios, etc.).
   * El registro debe crear una **cuenta estándar** de usuario (con intención de ser tenant_admin), NO asociada aún a un hospital u organización específica.

2. **Comportamiento de la pantalla `/register` (UX):**

   * La tarjeta/formulario no debe “salirse” de la pantalla en móvil.
   * Debe ser posible **hacer scroll vertical** para ver todos los campos y el botón de enviar.
   * Ajustar el tamaño de la card y/o el layout para que:

     * En pantallas pequeñas, se muestre un título + campos + botón, siempre accesibles con scroll.
     * No quede contenido “cortado” sin posibilidad de desplazar.

3. **Resultado del registro:**

   * El usuario se crea en Cognito.
   * Su rol por defecto a nivel de negocio debería ser **algo que le permita solicitar una tenencia**, típicamente `tenant_admin` inicial sin tenant asignado.
   * NO se le asigna ningún `tenantId` todavía.
   * Luego de registrarse y autenticarse, **NO debe ir directamente al dashboard ni a rutas que requieren tenant**.

4. **Redirección post-registro / post-login inicial:**

   * Si el usuario está autenticado y **no tiene tenencias activas**:

     * Debe ir a **`/account/tenancies` (Mis Tenencias)**.
   * Desde ahí, puede:

     * Ver sus solicitudes de tenencia (si las tiene).
     * Crear una nueva solicitud de tenencia.

---

#### 5.3. Pantalla “Mis Tenencias” (account/tenancies)

**Objetivo:** es el hub principal para cualquier usuario que aún no ha entrado a una organización concreta, especialmente tenant_admins.

**Requerimientos funcionales:**

1. La pantalla debe listar **todas las tenencias relacionadas con el usuario** (según la tabla `TenantUsers` y/o `TenancyRequests`):

   * Cada tenencia debe mostrar, al menos:

     * Nombre de la organización.
     * Slug.
     * Estado de la relación con el usuario: `pendiente`, `aprobada/activa`, `rechazada`, etc.
     * Tipo de relación (si es solicitante, tenant_admin, staff).

2. Cuando una solicitud de tenencia está **aprobada/activa**:

   * Debe existir una **acción clara para “Ingresar” o “Gestionar”** esa tenencia.
   * Esta acción debe:

     * Llamar a `/tenancy/switch` con el `tenantId` correspondiente.
     * Actualizar el `tenantId` activo del usuario (claims / contexto).
     * Redirigir al usuario al **dashboard del tenant** (`/dashboard`).

3. Un mismo usuario puede ver **múltiples tenencias**:

   * Por ejemplo, si es tenant_admin de varios centros.
   * Cada tenencia debe ser una tarjeta o fila seleccionable con un botón tipo:

     * “Entrar a [Nombre Tenant]” → que hace el switch y envía a `/dashboard`.

4. “Mis Tenencias” también debe permitir:

   * Acceder a la pantalla de **“Solicitar Tenencia”** (`/account/request-tenancy`).
   * Ver el estado de las solicitudes ya enviadas (pendientes, aprobadas, rechazadas).

> Requisito de negocio clave:
> Un tenant_admin **no debe ver dashboards, boxes, citas, etc. hasta que haya seleccionado explícitamente una de sus tenencias** desde esta pantalla.

---

#### 5.4. Flujo “Solicitar Tenencia”

**Pantalla:** `/account/request-tenancy`

**Propósito de negocio:**

* Permitir que un usuario autenticado (futuro tenant_admin) solicite la creación de una nueva organización/tenant en el sistema.

**Requerimientos:**

1. El formulario debe pedir datos de la organización:

   * Nombre comercial del centro.
   * Tipo de organización (clínica, gimnasio, centro de kinesiología, etc.) — opcional pero deseable.
   * Email de contacto.
   * Slug (identificador corto único para URLs).
   * Información opcional (descripción, número máximo de usuarios, etc.).

2. Al enviar el formulario:

   * Se crea un registro en `TenancyRequests` asociado al `cognitoSub` del usuario solicitante.
   * Estado inicial: `pending`.

3. Visualización posterior:

   * En “Mis Tenencias”, la solicitud debe aparecer como **pendiente**.
   * Cuando un super_admin la apruebe:

     * Se debe crear un registro en `Tenants`.
     * Se debe crear (o asegurar que existe) la relación en `TenantUsers` marcando a este usuario como **tenant_admin de ese tenant**.
     * En “Mis Tenencias” debe cambiar a estado **aprobada/activa** con opción de “Ingresar”.

4. Terminología:

   * Evitar completamente la palabra “hospital” en este flujo.
   * Usar siempre la palabra **“tenencia”** o “organización”.

---

#### 5.5. Flujo “Entrar a una tenencia” y navegación con tenant activo

Una vez que el usuario tiene una o más tenencias activas:

1. Desde “Mis Tenencias” selecciona **una tenencia** y ejecuta `/tenancy/switch`.
2. El sistema:

   * Actualiza el `tenantId` activo (claims/estado).
   * Redirige al **dashboard** (`/dashboard`).
3. Con un `tenantId` activo:

   * Se habilitan rutas como:

     * `/dashboard`
     * `/boxes`, `/boxes/new`, `/boxes/:id/edit`
     * `/staff`, `/staff/new`, `/staff/:id/edit`
     * `/appointments`, `/appointments/new`, `/appointments/:id/edit`
   * Todos estos módulos operan **exclusivamente sobre el tenant activo**.

Si el usuario cambia de tenencia (por ejemplo desde un selector en el layout o volviendo a “Mis Tenencias”):

* Se vuelve a llamar a `/tenancy/switch` con el nuevo `tenantId`.
* Se recarga el contexto del tenant y el dashboard asociado.

---

#### 5.6. Gestión de usuarios dentro de una tenencia (tenant_admin)

Actualmente existe en el panel del tenant_admin algo tipo **“Invitar usuario”**. Quiero cambiar la lógica de negocio:

**Nuevo enfoque:**

* El tenant_admin no “invita” usuarios, sino que los **crea directamente** en su tenencia.

**Requerimientos funcionales:**

1. En `/admin/users` (para tenant_admin):

   * La UI debe presentar esto como **“Gestión de Usuarios”** de la organización.
   * Acciones permitidas:

     * Crear usuario.
     * Editar usuario.
     * Desactivar/bloquear usuario (si aplica).
   * No quiero centrar el concepto en “invitar”, sino en **“crear cuenta de usuario interna”**.

2. Flujo “Crear usuario” (tenant_admin):

   * El tenant_admin rellena:

     * Nombre.
     * Email.
     * Rol dentro del tenant (`staff` o eventualmente otros roles permitidos).
   * El sistema:

     * Crea el usuario en Cognito (AdminCreateUser o flujo equivalente).
     * Lo asocia en `TenantUsers` al `tenantId` activo, con el rol elegido.
     * (Opcional/ideal) Envía un email de bienvenida y/o define un password temporal.
   * Así, el usuario ya queda listo para operar en ese tenant cuando inicie sesión.

3. Restricciones:

   * El tenant_admin **solo puede gestionar usuarios de su tenant activo**.
   * No debe ver usuarios de otros tenants.

4. Terminología en UI:

   * Cambiar textos tipo “Invitar usuario” por “Crear usuario” o “Agregar usuario”.
   * Dejar claro que son **usuarios de la organización actual** (tenant activo).

---

### 6. UX/Flujos específicos que quiero que arregles

Aquí están las mejoras concretas que ya detecté y quiero que implementes:

1. **Login visible en móvil:**

   * Problema actual: en celular no aparece “Iniciar sesión” en ninguna parte visible.
   * Solución requerida:

     * Añadir un botón/enlace de “Iniciar sesión” en el **header** en vistas móviles.
     * Debe ser fácilmente accesible desde la pantalla inicial.

2. **Pantalla “Crear cuenta” (registro) demasiado grande en móvil:**

   * Problema actual: la tarjeta es muy alta, se sale de la pantalla y no se puede scrollear hacia abajo.
   * Solución requerida:

     * Hacer que el contenedor de registro permita scroll vertical en pantallas pequeñas.
     * Ajustar paddings/márgenes y altura máxima para que la experiencia sea fluida en mobile.
     * Asegurarse de que el botón de “Crear cuenta” siempre sea accesible con scroll.

3. **Registro NO debe pedir seleccionar “hospital”:**

   * Quitar cualquier selección conceptual de “hospital” en el registro.
   * Concepto correcto: crear cuenta de usuario (potencial tenant_admin) general.
   * La relación con una organización concreta se hace **luego**, a través de “Solicitar Tenencia”.

4. **Post-registro NO debe llevar directo al dashboard:**

   * Cambiar la lógica de redirección post-login/post-registro:

     * Usuarios sin tenencias activas → `/account/tenancies`.
     * Solo usuarios con un `tenantId` activo (ya seleccionado) → `/dashboard`.

5. **Pantalla “Mis Tenencias” debe ser más útil:**

   * Problema actual:

     * Se ve estado “aprobado”, pero no se puede “entrar” claramente a la tenencia.
   * Solución requerida:

     * Mostrar listado de todas las tenencias del usuario.
     * Para cada tenencia activa, botón claro de **“Entrar” / “Gestionar esta tenencia”** que:

       * Llama a `/tenancy/switch`.
       * Redirige a `/dashboard`.
     * Mostrar también tenencias pendientes/rechazadas con estados visibles.

6. **Panel admin de tenant_admin: creación directa de usuarios:**

   * Cambiar el foco de “Invitar usuario” a **“Crear usuario”**:

     * UI: textos, labels, botones.
     * Lógica: crear usuarios en Cognito y asociarlos a la tenencia.
   * Mantener el endpoint `/admin/users` y su semántica, pero alinearlo con esta lógica de creación directa.

---

### 7. Reglas y restricciones técnicas para tus cambios

Al hacer estos cambios, respeta estas reglas:

1. **Multi-tenant:**

   * Todos los recursos de negocio (boxes, staff, citas, pacientes) deben seguir filtrándose por `tenantId`.
   * Nunca mezclar datos entre tenants.

2. **Claims de Cognito:**

   * Los atributos de rol y tenant actual (`custom:role`, `custom:tenantId`, etc.) están solo en el `id_token`.
   * El frontend debe seguir usando `id_token` donde se requieren estos claims.

3. **Rutas existentes:**

   * Mantén las rutas principales (`/dashboard`, `/boxes`, `/staff`, `/appointments`, `/settings`, `/account/tenancies`, `/account/request-tenancy`, `/admin/*`).
   * Ajusta redirecciones y guards de ruta para reflejar la lógica descrita:

     * Sin tenant → no entrar a módulos de tenant.
     * Con tenant activo → módulos de tenant habilitados.

4. **Backwards compatibility:**

   * Evita cambios de nombre en tablas DynamoDB.
   * Si necesitas agregar campos/atributos, hazlo sin romper los existentes.
   * Si necesitas nuevos endpoints, mantén la convención REST ya usada.

5. **UX consistente:**

   * Usa textos coherentes con el negocio: “tenencia”, “organización”, “usuario de la organización”, etc.
   * Elimina referencias a “hospital” en flujos genéricos.

---

### 8. Qué espero de ti

Con toda esta información, quiero que:

1. **Propongas la estructura de componentes y funciones** (frontend y backend) para implementar estos flujos de negocio de manera clara y mantenible.

2. **Modifiques la lógica de routing y redirecciones** para cumplir estrictamente:

   * Post-login/post-registro sin tenencias → “Mis Tenencias”.
   * “Entrar” a una tenencia → hace switch tenant y redirige a dashboard.

3. **Ajustes la UI/UX de:**

   * Header en mobile (botón de login).
   * Pantalla de registro (`/register`) con scroll correcto en móvil.
   * Pantalla “Mis Tenencias” para listar tenencias y permitir entrar a cada una.
   * Panel de usuarios del tenant_admin para creación directa de usuarios.

4. Me entregues:

   * Descripción de los cambios a nivel de **componentes React** y **handlers Lambda**.
   * Cambios de rutas y guards (por ejemplo en `ProtectedRoute`, `AdminRoute`, `RootRedirect`).
   * Cambios en textos y labels relevantes.

Quiero que toda tu respuesta y tus cambios respeten al máximo el **modelo de negocio multi-tenant** descrito arriba y que el producto se sienta como un **gestor de espacios físicos multi-organización**, no como algo exclusivo de hospitales.

---

> Nota: Si necesitas asumir detalles de implementación (por ejemplo, cómo enviar los emails de nuevos usuarios), haz supuestos razonables y explícitalos, pero no rompas la estructura actual del proyecto ni la separación por tenant.

---

Si quieres, puedo luego pedirte que generes el código paso a paso para cada sección, pero primero necesito que tomes este prompt como la **fuente de verdad funcional** del sistema.
