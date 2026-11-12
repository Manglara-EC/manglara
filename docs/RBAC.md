# RBAC de Manglara — roles, permisos y vistas

> Rama: `feature/rbac-roles-permisos` · Última revisión: 29 de octubre de 2026
> Fuente de verdad en código: `src/shared/constants/roles.ts` (roles y permisos) y
> `src/shared/lib/authz/` (evaluación). Este documento describe lo que el código aplica.

## 1. Modelo

Manglara usa **dos niveles de rol**. El primero dice qué es la persona en la plataforma; el
segundo, qué puede hacer dentro de **una** comuna (en el código, una comuna es una
`organization` de better-auth).

```
                 ┌──────────────────────────── Plataforma ─────────────────────────────┐
 Rol global      │  user (cliente)                          admin (administrador global) │
 user.role       └───────────────┬──────────────────────────────────────┬────────────────┘
                                 │ es miembro de 0..n comunas            │ modera y gestiona
                                 ▼                                       ▼ CUALQUIER comuna
 Rol por comuna  ┌───────────── Comuna (organization) ─────────────────────────────────┐
 member.role     │  owner (admin de comuna) · admin (co-admin) · seller · member        │
                 └──────────────────────────────────────────────────────────────────────┘
```

- **Rol global** (`user.role`): `user` o `admin`. Cualquier otro valor heredado (`seller`,
  `owner`, vacío) se trata como `user`.
- **Rol por comuna** (`member.role`): `owner`, `admin`, `seller`, `member`. Una persona puede
  tener roles distintos en comunas distintas (p. ej. vendedor en una y miembro en otra).
- Un **administrador de comuna** (`owner`/`admin`) administra **solo** esa comuna. No obtiene
  permisos sobre otras comunas ni sobre la plataforma.
- El **administrador global** es el equipo de Manglara: gestiona cuentas, crea y elimina
  comunas y puede moderar y gestionar cualquier comuna. No vende salvo que tenga un rol de
  venta en una comuna.

### Decisiones que resuelven la "Decisión pendiente" de la revisión

| Pregunta de la revisión | Decisión implementada |
|---|---|
| ¿El administrador de comuna es el owner de la organización o un rol global nuevo? | Es el rol **por comuna** `owner` (con `admin` como co-administrador). No existe rol global de comuna. |
| ¿Quién aprueba los ítems? | **Ambos**: los administradores de la comuna del ítem y el administrador global. Nadie aprueba sus propios ítems. |
| ¿Quién puede eliminar una comuna y qué pasa con productos y ventas? | Solo el **administrador global**, escribiendo el nombre de la comuna. Se bloquea si algún ítem tiene ventas o reservas (para no perder historial); si no, se eliminan en cascada miembros, invitaciones, productos y servicios. |
| ¿Quién puede crear comunas? | Solo el **administrador global** (quien la crea queda como owner y puede designar al administrador de la comuna). |
| Usuarios de prueba | `owner` perdió el rol global `admin`; `owner1` y `vendedor` tienen rol global válido (`user`). Se creó la cuenta `admin` para el equipo de Manglara. |

## 2. Roles

| Rol | Nivel | Quién es | Cómo se obtiene |
|---|---|---|---|
| Invitado | — | Visitante sin sesión | — |
| Usuario | global `user` | Cliente / turista | Registro (valor por defecto) |
| Miembro | comuna `member` | Residente sin venta | Invitación o asignación |
| Vendedor | comuna `seller` | Emprendedor de la comuna | Invitación con rol *Vendedor* o cambio de rol |
| Co-administrador | comuna `admin` | Apoyo del líder de la comuna | Lo asigna un owner o el admin global |
| Administrador de comuna | comuna `owner` | Líder comunitario | Lo asigna el admin global (o otro owner) |
| Administrador global | global `admin` | Equipo de Manglara | Lo asigna otro admin global en `/admin` |

## 3. Catálogo de permisos

Los nombres coinciden con `src/shared/constants/roles.ts`.

**Globales** (no dependen de una comuna)

| Permiso | Invitado | Usuario | Admin global |
|---|:-:|:-:|:-:|
| `catalog:view` — ver catálogo aprobado | ✅ | ✅ | ✅ |
| `cart:use`, `order:create`, `booking:create` | ❌ | ✅ | ✅ |
| `activity:view_own` — mis compras y reservas | ❌ | ✅ | ✅ |
| `account:manage` — configuración de la cuenta | ❌ | ✅ | ✅ |
| `organization:view_directory` — directorio de comunas | ❌ | ✅ | ✅ |
| `invitation:respond` — aceptar/rechazar invitaciones propias | ❌ | ✅ | ✅ |
| `platform:access_admin_panel`, `platform:manage_users` | ❌ | ❌ | ✅ |
| `organization:create`, `organization:delete` | ❌ | ❌ | ✅ |
| `organization:manage_any`, `item:moderate_any` | ❌ | ❌ | ✅ |

**Por comuna** (se evalúan con el rol en ESA comuna; el admin global los tiene en todas,
salvo los de venta)

| Permiso | member | seller | admin | owner | admin global |
|---|:-:|:-:|:-:|:-:|:-:|
| `organization:view_members` (nombres y roles) | ✅ | ✅ | ✅ | ✅ | ✅ |
| `organization:view_member_emails` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `organization:update` (nombre/slug) | ❌ | ❌ | ✅ | ✅ | ✅ |
| `organization:view_stats` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `invitation:create`, `invitation:cancel` | ❌ | ❌ | ✅ | ✅ | ✅¹ |
| `member:update_role`, `member:remove` | ❌ | ❌ | ✅² | ✅ | ✅ |
| `item:create`, `item:update_own`, `item:delete_own` | ❌ | ✅ | ✅ | ✅ | ❌ |
| `item:view_all` (todos los estados) | ❌ | ❌ | ✅ | ✅ | ✅ |
| `item:moderate` (aprobar/rechazar, nunca lo propio) | ❌ | ❌ | ✅ | ✅ | ✅ |
| `item:delete_any` | ❌ | ❌ | ✅ | ✅ | ✅ |

¹ Las invitaciones de better-auth exigen ser miembro; el admin global agrega miembros
directamente con **Asignar miembro**.
² El co-administrador solo asigna y gestiona `seller` y `member`; no toca owners ni otros
co-administradores. Solo un owner (o el admin global) asigna `owner`/`admin`. La comuna
nunca puede quedar sin owner.

## 4. Matriz de funcionalidades por rol

Leyenda: ✅ permitido · ❌ denegado (el servidor lo rechaza) · 🔸 solo lo propio · 🏠 solo en
sus comunas.

| Área / funcionalidad | Invitado | Usuario | Miembro | Vendedor | Co-admin | Admin comuna | Admin global |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **Catálogo** — inicio, explorar, detalle de ítem aprobado | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver ítem pendiente/rechazado por URL pública | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Compras** — carrito, checkout, reservar | ❌ | ✅ | ✅ | ✅³ | ✅³ | ✅³ | ✅ |
| Mis actividades (compras/reservas) y cancelar reservas | ❌ | 🔸 | 🔸 | 🔸 | 🔸 | 🔸 | 🔸 |
| **Cuenta** — configuración, 2FA, sesiones | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Perfil público `/[usuario]` (nombre, usuario, foto) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Comunas** — directorio y vista pública con tienda | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver miembros (nombre y rol) | ❌ | ❌ | 🏠 | 🏠 | 🏠 | 🏠 | ✅ |
| Ver correos de miembros | ❌ | ❌ | ❌ | ❌ | 🏠 | 🏠 | ✅ |
| Ver/aceptar mis invitaciones | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Invitar (eligiendo rol) y cancelar invitaciones | ❌ | ❌ | ❌ | ❌ | 🏠² | 🏠 | ✅¹ |
| Cambiar rol / quitar miembros | ❌ | ❌ | ❌ | ❌ | 🏠² | 🏠 | ✅ |
| Agregar miembro directamente | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Editar nombre/slug de la comuna | ❌ | ❌ | ❌ | ❌ | 🏠 | 🏠 | ✅ |
| Estadísticas de la comuna | ❌ | ❌ | ❌ | ❌ | 🏠 | 🏠 | ✅ |
| Crear comuna | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Eliminar comuna (confirmando nombre; sin ventas) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Venta** — panel de vendedor `/seller` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌⁴ |
| Crear producto/servicio (queda pendiente) | ❌ | ❌ | ❌ | 🏠 | 🏠 | 🏠 | ❌⁴ |
| Ver/editar mis ítems (editar → vuelve a pendiente) | ❌ | ❌ | ❌ | 🔸 | 🔸 | 🔸 | ❌⁴ |
| Eliminar mis ítems pendientes o rechazados (sin ventas ni reservas) | ❌ | ❌ | ❌ | 🔸 | 🔸 | 🔸 | ❌⁴ |
| Ver/editar ítems de otros vendedores | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Moderación** — ver todos los ítems de la comuna | ❌ | ❌ | ❌ | ❌ | 🏠 | 🏠 | ✅ |
| Revisar ítem (`/review/:tipo/:id`) | ❌ | ❌ | ❌ | ❌ | 🏠 | 🏠 | ✅ |
| Aprobar / rechazar (con razón) | ❌ | ❌ | ❌ | ❌ | 🏠⁵ | 🏠⁵ | ✅⁵ |
| Eliminar ítems de la comuna | ❌ | ❌ | ❌ | ❌ | 🏠 | 🏠 | ✅ |
| **Plataforma** — panel `/admin` (usuarios) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Cambiar rol global, bloquear, eliminar cuentas | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

³ Nadie puede comprar ni reservar sus propios ítems.
⁴ Salvo que el admin global también tenga rol de venta en alguna comuna.
⁵ Nunca sobre ítems propios.

## 5. Vistas y menú por rol

| Rol | Menú lateral | Qué ve en `/organizations/<comuna>` |
|---|---|---|
| Invitado | Inicio, Explorar | (pide iniciar sesión) |
| Usuario | Inicio, Explorar, Mis actividades, Carrito, Comunas, Configuración | Vista pública con tienda; sus invitaciones pendientes en `/organizations` |
| Miembro | igual que Usuario | Encabezado con su rol, tienda, miembros **sin correos** |
| Vendedor | + Dashboard, Mis Productos, Mis Servicios | + "Mis ítems en esta comuna" (solo los suyos, con estado y ventas) |
| Co-admin / Admin de comuna | + **Mi comuna** (o **Mis comunas**) | + estadísticas, todos los ítems con aprobar/rechazar, miembros **con correos** y acciones, invitaciones con rol, editar comuna |
| Admin global | Inicio, Explorar, Mis actividades, Carrito, **Admin**, Comunas, Configuración | Gestión de cualquier comuna + **Asignar miembro** + **Zona de peligro** (eliminar) y botón **Crear organización** |

## 6. Dónde se aplica cada regla

1. **Middleware** (`src/middleware.ts`): sin cookie de sesión solo se navega lo público.
2. **Layouts/páginas servidor**: `/admin` exige admin global; `/seller/*` exige rol de venta en
   alguna comuna; `/review/*` y la vista de comuna se arman según los permisos efectivos.
3. **Server actions** (barrera real): cada acción obtiene el acceso con `getViewer()` y lo evalúa
   con `canInOrganization`, `canModerateItem`, `canEditItem`, `canDeleteItem`, etc.
   Los roles se leen **de la base de datos** en cada petición (no de la sesión cacheada en
   Redis), así que un cambio de rol, una expulsión o un bloqueo surten efecto de inmediato.
4. **Endpoints de better-auth** (`/api/auth/*`, invocables desde el navegador):
   `authorization-guard.ts` aplica las mismas reglas antes de que better-auth ejecute nada:
   - `/organization/create` solo admin global; `/organization/delete` y `/organization/update`
     bloqueados (se usan las acciones propias, que validan y confirman).
   - Invitar y cancelar invitaciones respetan la jerarquía (co-admin solo `seller`/`member`),
     exigen **un único rol** (no `"owner,member"`) y reinvitar no puede anular ni extender una
     invitación de rol superior.
   - Cambiar rol y quitar miembros solo por las acciones de la app, que en una transacción
     garantizan que la comuna nunca quede sin owner (los endpoints directos están bloqueados).
     Por la misma razón un owner no puede salir de la comuna por su cuenta: lo quita otro owner
     o el admin global.
   - `list-members`, `list-invitations` y `get-full-organization` (devuelven correos) solo para
     administradores de esa comuna, y la petición debe nombrar exactamente una comuna.
   - `/admin/*` exige admin global vigente en la BD, solo las rutas y campos que usa el panel
     (sin suplantación ni cambio de contraseñas ajenas), solo roles globales `user`/`admin`, y
     no elimina la cuenta del único owner de una comuna.
   Los roles de comuna están declarados en el control de acceso del plugin
   (`organization-access.ts`); ninguno incluye `organization:delete`.
5. **Datos**: la vista de comuna ya no serializa la organización completa en el HTML; correos e
   invitaciones solo viajan a quien tiene permiso. El perfil público solo expone nombre,
   usuario y foto. Las fichas públicas no devuelven quién moderó ni razones de rechazo.

## 7. Cuentas de prueba

Contraseña: la de prueba que comparte el equipo (la misma para todas). Se crean/actualizan con
`npx tsx scripts/rbac/seed-test-users.ts` (idempotente). Los roles heredados se normalizan con
`scripts/rbac/normalize-roles.sql`.

| Usuario | Rol global | Rol por comuna | Para probar |
|---|---|---|---|
| `admin` | admin | — | Administrador global |
| `owner1` | user | owner en Playas | Administrador de comuna |
| `owner2` | user | owner en La libertad | Aislamiento entre comunas |
| `owner` | user | co-admin en Playas; owner en prueba y La libertad | Co-administrador y varias comunas |
| `vendedor` | user | seller en Playas | Vendedor |
| `vendedor2` | user | seller en La libertad | Aislamiento entre vendedores |
| `miembro` | user | member en Playas | Miembro sin venta |
| `user` | user | — | Cliente |

## 8. Estado de los hallazgos de la revisión (Word del 23/10/2026)

| # | Sev. | Hallazgo | Antes | Ahora |
|---|---|---|---|---|
| 1 | Alta | El admin de comuna entra a `/admin` y gestiona a todos los usuarios | ❌ No cumplía | ✅ `owner` ya no es admin global; `/admin` y `/api/auth/admin/*` exigen admin global leído de la BD |
| 2 | Alta | `owner1` con rol global inválido entra con el menú vacío | ❌ | ✅ Roles globales normalizados (`user`/`admin`); menú por capacidades con "Mi comuna" |
| 3 | Alta | El dueño de comuna no puede aprobar ni rechazar (404) | ❌ | ✅ Moderación por comuna: columna Acciones y `/review` para administradores de esa comuna; nadie aprueba lo propio |
| 4 | Alta | Un vendedor invitado no puede crear productos | ❌ | ✅ Se invita eligiendo rol (Vendedor…); crear exige rol de venta **en esa comuna**. Además se corrigió que invitar fallaba con 500 (faltaba `invitation.created_at`) |
| 5 | Alta | El vendedor ve servicios ajenos (incluidos pendientes) | ❌ | ✅ El panel solo muestra ítems propios; para ajenos responde "no encontrado" |
| 6 | Media | Owner/admin de comuna pueden eliminar la comuna | ❌ | ✅ Solo admin global, escribiendo el nombre; bloqueado si hay ventas/reservas |
| 7 | Media | Cualquier miembro ve correos; invitaciones en el HTML | ❌ | ✅ Correos e invitaciones solo para administradores de la comuna; nada sensible en el HTML |
| 8 | Media | El formulario de edición carga productos ajenos | ❌ | ✅ Solo carga ítems propios |
| 9 | Media | Cualquier usuario crea comunas | ❌ | ✅ Solo admin global (configuración, guarda y botón) |
| 10 | Baja | Precio 0 muestra el JSON crudo de zod | ❌ | ✅ Mensaje legible y campo marcado en rojo |
| 11 | Baja | Los rechazados no se pueden eliminar; diálogo engañoso | ❌ | ✅ Se eliminan pendientes y rechazados; el diálogo explica que deja de mostrarse |
| 12 | Baja | Al editar no se cambian imágenes; editar un aprobado no avisa | ❌ | ✅ Edición de imágenes; al editar vuelve a revisión y se notifica a los administradores de la comuna |
| 13 | Baja | Página `/debug` accesible | ❌ | ✅ Eliminada |
| 14 | Baja | Precio/stock sin máximo (error 500); imágenes de R2 nunca se borran | ❌ | ✅ Máximos de precio, stock, capacidad e imágenes; al editar se borran de R2 las imágenes quitadas |

## 9. Hallazgos adicionales corregidos

Encontrados en la auditoría y por los agentes validadores (todos reproducidos y con prueba de
regresión en la batería automática):

| Sev. | Hallazgo | Corrección |
|---|---|---|
| Alta | El perfil `/[usuario]` devolvía a cualquier usuario el correo, rol, bloqueo y 2FA de otra cuenta | Solo nombre, usuario y foto |
| Alta | Los permisos se leían de la sesión cacheada en Redis: quitar un rol o expulsar a alguien no surtía efecto hasta que expirara la sesión (días) | Rol global y membresías se leen de la BD en cada petición |
| Alta | Un admin de la comuna A que era miembro de B podía leer correos e invitaciones de B combinando `organizationId` de A con `organizationSlug` de B | La guarda exige una sola comuna y valida la que realmente consultará better-auth |
| Media | Invitar fallaba con error 500 (better-auth 1.6 exige `invitation.created_at`) | Migración `0002_add_invitation_created_at` |
| Media | Roles compuestos (`"owner,member"`) permitían dejar una comuna sin owner | Un único rol por miembro; roles compuestos heredados cuentan como el mayor |
| Media | El admin global podía editar el contenido de ítems de cualquier vendedor | Solo el vendedor dueño edita; la moderación aprueba/rechaza/elimina |
| Media | Mover un ítem a una comuna donde solo eras miembro; `createService` exigía rol global | Rol de venta en la comuna destino; mismas reglas para productos y servicios |
| Media | Cancelar reservas ya pasadas desde la API | Rechazado en el servidor |
| Baja | Co-admin cancelaba invitaciones de nivel owner/admin | Solo las de roles que puede asignar |
| Baja | `/organization/update` directo saltaba la validación de slug/logo/metadata | Bloqueado; se usa la acción propia |
| Baja | `set-role` aceptaba roles globales arbitrarios; suplantación y cambio de contraseñas ajenas habilitados | Solo `user`/`admin`; rutas admin en lista blanca |
| Baja | `/api/upload` aceptaba a cualquier cuenta y confiaba en el MIME declarado | Solo vendedores y firma real JPG/PNG/WebP |
| Baja | La agenda de un servicio pendiente se exponía sin sesión | Solo servicios aprobados |
| Baja | Aprobar contenido que el vendedor editó mientras se revisaba | Decisión atómica sobre la versión revisada (si cambió: "recarga") |
| Baja | Comprar/reservar los propios ítems; reservar productos en fechas pasadas | Rechazado (`OWN_ITEM`, `INVALID_DATES`) |
| Baja | Acciones sin uso y peligrosas (`createBooking` confiaba en el precio del cliente, `uploadImageAction` sin validación) | Eliminadas |
| Media | Reinvitar un correo anulaba o extendía una invitación de rol superior (co-admin sobre invitaciones de owner/admin) | La guarda valida también la invitación pendiente |
| Media | Al editar un ítem se podían borrar de R2 imágenes de otros vendedores (copiando su URL y quitándola) | Solo se borran imágenes que ningún otro ítem referencia |
| Baja | Dos degradaciones simultáneas podían dejar una comuna sin owner | Conteo y cambio en una transacción con bloqueo |
| Baja | El admin global podía eliminar la cuenta del único owner de una comuna, o cambiar campos internos con `/admin/update-user` | Bloqueado; solo los campos del panel |
| Baja | Un vendedor podía retirar un ítem aprobado con ventas en dos pasos (editar → pendiente → eliminar) | Con ventas o reservas solo lo retira la administración de la comuna |
| Baja | Avisos al vendedor en inglés; errores de validación en inglés | En español |

## 10. Cómo validar

- Batería automática (páginas, `/api/auth/*` y server actions invocadas directamente con cada
  cuenta): ver `scripts/rbac/README.md`.
- Migraciones de BD necesarias: `0002_add_invitation_created_at.sql` y
  `scripts/rbac/normalize-roles.sql` (idempotentes).

## 11. Decisiones y riesgos aceptados

- **El admin global no invita a comunas donde no es miembro** (las invitaciones de better-auth
  exigen membresía). Usa **Asignar miembro**, que agrega una cuenta existente con el rol elegido.
- **El token de sesión es visible para el JavaScript de la página** (better-auth lo devuelve en
  `/api/auth/get-session` y la app lo hidrata). Por sí solo no autentica: la cookie va firmada.
  Riesgo bajo, propio de better-auth.
- **Borrado lógico**: eliminar un ítem lo oculta pero conserva el historial de ventas y reservas.
  Por eso una comuna con ventas no se puede eliminar y el vendedor no retira por su cuenta ítems
  con ventas o reservas.
- **Correos de invitación**: si el envío falla, la invitación sigue válida y el invitado la ve en
  `/organizations` (con `onboarding@resend.dev` solo se entregan correos a la cuenta de Resend).
- **Bloquear al único owner** de una comuna está permitido al admin global (por ejemplo, ante
  un abuso): la comuna sigue gestionable por el admin global, que puede asignar otro owner.
