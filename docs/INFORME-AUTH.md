# INFORME: ESTADO DEL SISTEMA DE AUTENTICACIÓN — MANGLARA

> **Tipo:** Informe técnico para PM  
> **Biblioteca:** [Better Auth v1](https://www.better-auth.com/)  
> **Base de datos:** PostgreSQL (Neon Serverless) + Drizzle ORM  
> **Cache:** Redis (Upstash)  
> **Emails:** Resend  
> **Última actualización:** Junio 2026

---

## 1. DIAGRAMA GENERAL

```
┌─────────────────────────────────────────────────────────────────┐
│                     MÉTODOS DE AUTENTICACIÓN                      │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Email +      │  │ Google OAuth  │  │ Magic Link   │           │
│  │ Contraseña   │  │ (Social)      │  │ (solo login) │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                 │                 │                     │
│         └─────────────────┼─────────────────┘                     │
│                           │                                       │
│                     ┌─────▼──────┐                                │
│                     │  2FA (TOTP) │ ← opcional                   │
│                     └─────┬──────┘                                │
│                           │                                       │
│                     ┌─────▼──────┐                                │
│                     │ Verificación│ ← obligatorio para email      │
│                     │ de email    │                                │
│                     └─────┬──────┘                                │
│                           │                                       │
│                     ┌─────▼──────┐                                │
│                     │  SESIÓN    │                                │
│                     └─────┬──────┘                                │
│                           │                                       │
│              ┌────────────┼────────────┐                          │
│              │            │            │                          │
│         ┌────▼───┐  ┌────▼───┐  ┌─────▼────┐                    │
│         │Usuario  │  │Vendedor│  │ Admin    │                    │
│         │(USER)   │  │(SELLER)│  │ (ADMIN)  │                    │
│         └─────────┘  └────────┘  └──────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. FUNCIONALIDADES IMPLEMENTADAS

### 2.1 Registro de usuario (`/sign-up`)

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Registro con email/contraseña | ✅ Completo | Campos: nombre, usuario (@username), email, contraseña |
| Registro con Google | ✅ Completo | Botón "Google" — crea usuario automáticamente |
| Validación de contraseña | ✅ Completo | Mín. 8 chars, debe tener: 1 dígito, 1 minúscula, 1 mayúscula, 1 carácter especial |
| Indicador de fortaleza | ✅ Completo | Barra visual en tiempo real mientras se escribe |
| Verificación de email | ✅ Completo | Obligatorio — se envía email con enlace de verificación |
| Auto-login al verificar | ✅ Completo | Al hacer clic en el enlace, inicia sesión automáticamente |
| Avatar automático | ✅ Completo | Se genera un avatar de Gravatar basado en el email |
| Chequeo de contraseñas filtradas | ✅ Completo | Plugin "Have I Been Pwned" — bloquea contraseñas comprometidas |
| Rate limiting | ✅ Completo | Anti-abuso con Redis — muestra toast si se excede |

**Flujo:** `Formulario → Validación → POST /api/auth/sign-up/email → BD → Email verificación → Click → Auto-login → /home`

### 2.2 Inicio de sesión (`/sign-in`)

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Login con usuario/contraseña | ✅ Completo | Campo usuario (@) + contraseña |
| Login con Google | ✅ Completo | Botón "Google" — OAuth flow |
| Magic Link (enlace mágico) | ✅ Completo | Solo email, recibe enlace para login sin contraseña |
| Toggle entre métodos | ✅ Completo | Switch credentials ↔ magic link en la misma página |
| 2FA (doble factor) | ✅ Completo | Si está activado, redirige a `/2fa` tras login |

**Flujo credentials:** `Usuario + contraseña → (2FA si activado) → Sesión → /home`  
**Flujo magic link:** `Email → Enlace mágico en el correo → Click → Sesión → /home`

### 2.3 Recuperación de contraseña

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Olvidé contraseña | ✅ Completo | `/forgot-password` — ingresa email, recibe enlace |
| Restablecer contraseña | ✅ Completo | `/reset-password?token=...` — nueva contraseña + confirmación |
| Token inválido/expirado | ✅ Completo | Redirige a `/forgot-password` si no hay token válido |
| Email de restablecimiento | ✅ Completo | Template React Email con enlace (expira en 1 hora) |

### 2.4 Autenticación de dos factores (2FA)

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Activar 2FA | ✅ Completo | En Settings > Security, toggle + escaneo QR (TOTP) |
| Desactivar 2FA | ✅ Completo | Requiere contraseña actual para desactivar |
| Verificar código al login | ✅ Completo | Input de 6 dígitos con auto-submit al completar |
| Códigos de respaldo | ✅ Completo | Se generan 8 códigos de un solo uso |
| Regenerar códigos | ✅ Completo | Requiere contraseña, invalida el set anterior |
| Usar código de respaldo | ✅ Completo | `/recovery` — código de 11 caracteres (formato xxxxx-xxxxx) |

### 2.5 Organizaciones (multi-tenant)

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Crear organización | ✅ Completo | Nombre, slug, logo opcional |
| Ver organizaciones | ✅ Completo | Sidebar con lista de orgs del usuario |
| Roles en organización | ✅ Completo | Owner, Admin, Member |
| Invitar miembros | ✅ Completo | Por email, email con link de invitación |
| Cancelar invitación | ✅ Completo | El owner/admin puede cancelar invitaciones pendientes |
| Aceptar/rechazar invitación | ✅ Completo | `/invitations?invitationId=...` |
| Eliminar miembros | ✅ Completo | Owner/admin puede remover miembros |
| Eliminar organización | ✅ Completo | Solo owner, con diálogo de confirmación |
| Ver items de la org | ✅ Completo | Lista de productos/servicios de la organización |
| Verificación de email en invitación | ✅ Completo | Requiere email verificado para aceptar invitación |

### 2.6 Administración (RBAC)

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Panel de administración | ✅ Completo | `/admin` — tabla de usuarios con filtros y paginación |
| Actualizar rol de usuario | ✅ Completo | Cambiar entre USER, SELLER, ADMIN |
| Banear/desbanear usuario | ✅ Completo | Con razón y fecha de expiración opcional |
| Eliminar usuario | ✅ Completo | Soft delete o eliminación permanente |
| Aprobar/rechazar items | ✅ Completo | Productos y servicios pendientes |
| Ver items como admin | ✅ Completo | Vista detallada con info del vendedor y organización |

**Roles del sistema:**

| Rol | Permisos clave | Descripción |
|-----|---------------|-------------|
| **USER** (Usuario) | Ver productos/servicios, comprar | Rol por defecto al registrarse |
| **SELLER** (Vendedor) | USER + crear/editar/eliminar productos y servicios, ver ventas y analíticas | Para vendedores de la plataforma |
| **ADMIN** (Administrador) | SELLER + gestionar usuarios, roles, ver todos los productos | Superusuario del sistema |

### 2.7 Configuración de cuenta (`/settings`)

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Cambiar nombre | ✅ Completo | Campo simple |
| Cambiar nombre de usuario | ✅ Completo | @username, validación de unicidad |
| Cambiar email | ✅ Completo | Requiere verificación del nuevo email vía enlace |
| Cambiar contraseña | ✅ Completo | Contraseña actual + nueva, cierra todas las sesiones |
| Sesiones activas | ✅ Completo | Lista de dispositivos, revocar sesiones individuales |
| Cerrar sesión | ✅ Completo | Desde dropdown del perfil, atajo Ctrl+O |

### 2.8 Protección de rutas

| Tipo de ruta | Comportamiento |
|-------------|----------------|
| `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/2fa`, `/recovery` | Solo accesible **sin sesión**. Si hay sesión → redirige a `/home` |
| `/terms`, `/privacy` | Públicas, accesibles siempre |
| Todo lo demás (`/home`, `/settings`, `/admin`, etc.) | Requiere **sesión activa**. Sin sesión → redirige a `/sign-in` |
| API (`/api/*`) | Sin restricción (gestionado por Better Auth internamente) |

---

## 3. ARQUITECTURA TÉCNICA

### 3.1 Estructura de archivos (simplificada)

```
src/
├── app/
│   ├── (auth)/                  ← Grupo de páginas de auth (sin sesión)
│   │   ├── layout.tsx           ← Layout centrado con theme toggle
│   │   ├── sign-in/page.tsx
│   │   ├── sign-up/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   ├── 2fa/page.tsx
│   │   └── recovery/page.tsx
│   ├── (manglara)/              ← Grupo de páginas protegidas (con sesión)
│   │   ├── layout.tsx           ← Layout con sidebar + nav
│   │   ├── home/page.tsx
│   │   ├── settings/...         ← Configuración de cuenta y seguridad
│   │   ├── admin/...            ← Panel de administración
│   │   └── organizations/...    ← Gestión de organizaciones
│   ├── api/auth/[...all]/route.ts ← API handler de Better Auth
│   └── middleware.ts            ← Protección de rutas
├── features/
│   ├── auth/                    ← Lógica de autenticación
│   │   ├── components/          ← Formularios UI (8 componentes)
│   │   ├── hooks/               ← Mutaciones y lógica de formularios (17 hooks)
│   │   └── schemas/             ← Validación Zod (6 schemas)
│   ├── admin/                   ← Funcionalidades de administración
│   ├── organizations/           ← Funcionalidades de organizaciones
│   └── settings/                ← Configuración de cuenta
├── shared/
│   ├── lib/
│   │   ├── better-auth/         ← Configuración de Better Auth (server + client)
│   │   ├── drizzle/             ← Esquema de BD y conexión
│   │   ├── react-email/         ← Templates de email (5 templates)
│   │   └── resend/              ← Cliente de envío de emails
│   ├── constants/
│   │   ├── roles.ts             ← Definición de roles y permisos
│   │   └── menu.ts              ← Menú de navegación por rol
│   └── components/              ← Componentes compartidos (sidebar, nav, etc.)
```

### 3.2 Base de datos — Tablas relevantes

| Tabla | Propósito | Columnas clave |
|-------|-----------|----------------|
| `user` | Usuarios del sistema | id, name, email, email_verified, username, display_username, image, role, two_factor_enabled, banned |
| `account` | Cuentas vinculadas | userId FK, provider_id, password (hash), access_token (OAuth) |
| `verification` | Tokens de verificación | identifier, value (JWT), expires_at |
| `two_factor` | Configuración 2FA | userId FK, secret (TOTP), backup_codes |
| `session` | Sesiones activas | userId FK, token, expires_at, ip_address, user_agent |
| `organization` | Organizaciones | id, name, slug, logo, metadata |
| `member` | Miembros de org | userId FK, organization_id FK, role (owner/admin/member) |
| `invitation` | Invitaciones pendientes | email, organization_id FK, inviter_id FK, role, status, expires_at |

### 3.3 Plugins de Better Auth activos

| # | Plugin | Función |
|---|--------|---------|
| 1 | `nextCookies()` | Manejo de cookies en Next.js |
| 2 | `username()` | Autenticación por nombre de usuario (@) |
| 3 | `magicLink()` | Login sin contraseña vía enlace mágico (solo usuarios existentes) |
| 4 | `twoFactor()` | Autenticación de dos factores con TOTP |
| 5 | `haveIBeenPwned()` | Verificación de contraseñas contra bases de datos filtradas |
| 6 | `admin()` | API de administración de usuarios (ban, unban, roles) |
| 7 | `organization()` | Multi-tenant: organizaciones, miembros, invitaciones |

### 3.4 Proveedores de autenticación

| Proveedor | Tipo | Registro | Login | Configuración |
|-----------|------|----------|-------|---------------|
| Email + Contraseña | Credenciales | ✅ | ✅ | `requireEmailVerification: true` |
| Google | OAuth 2.0 | ✅ | ✅ | `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` |
| GitHub | (definido en tipos pero no configurado en servidor) | ❌ | ❌ | Sin implementar |

### 3.5 Servicios externos

| Servicio | Uso | Variable de entorno |
|----------|-----|-------------------|
| **Neon** (PostgreSQL) | Base de datos principal | `DATABASE_URL` |
| **Upstash** (Redis) | Rate limiting, almacenamiento secundario | `UPSTASH_REDIS_REST_URL` + `TOKEN` |
| **Resend** | Envío de emails transaccionales | `RESEND_API_KEY` |
| **Google Cloud** | OAuth 2.0 para login con Google | `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` |
| **Gravatar** | Avatar automático para nuevos usuarios | No requiere API key |

---

## 4. FLUJOS COMPLETOS

### 4.1 Registro con email/contraseña

```
1. Usuario navega a /sign-up
2. Middleware verifica que NO tiene sesión → permite acceso
3. Se renderiza formulario con 4 campos: nombre, @usuario, email, contraseña
4. Validación en tiempo real vía Zod:
   - nombre: 2-50 caracteres
   - usuario: 3-30 caracteres, solo letras/números/guiones bajos
   - email: formato válido
   - contraseña: 8-50 caracteres, 1 dígito, 1 minúscula, 1 mayúscula, 1 especial
5. Al hacer submit:
   a. Se genera avatar de Gravatar (hash SHA-256 del email)
   b. POST /api/auth/sign-up/email con todos los datos
6. Servidor Better Auth:
   a. Verifica unicidad de usuario y email
   b. Chequea contraseña contra Have I Been Pwned
   c. Verifica rate limiting en Redis
   d. Hashea contraseña (bcrypt)
   e. INSERT en tabla user + account
   f. Genera token JWT de verificación → INSERT en tabla verification
   g. Envía email vía Resend con template VerifyEmail
7. Cliente recibe respuesta:
   - Éxito: toast "Cuenta creada, revisa tu correo"
   - Error de campo: marca el campo específico en rojo
   - Error de email: toast con botón "Reenviar correo"
   - Rate limit: toast silencioso
8. Usuario abre email, hace clic en enlace
9. GET /api/auth/verify-email?token=...&callbackURL=/home
10. Servidor valida JWT, marca email_verified = true, crea sesión
11. Usuario es redirigido a /home (ya autenticado)
```

### 4.2 Login con credenciales

```
1. Usuario navega a /sign-in
2. Ingresa @usuario + contraseña
3. POST /api/auth/sign-in/username
4. Servidor valida credenciales
5. Si tiene 2FA activado:
   a. Redirige a /2fa
   b. Usuario ingresa código TOTP de 6 dígitos
   c. POST /api/auth/two-factor/verify-totp
6. Crea sesión → redirige a /home
```

### 4.3 Login con Google

```
1. Usuario hace clic en botón "Google"
2. Cliente llama authClient.signIn.social({ provider: "google" })
3. Better Auth redirige a Google OAuth consent screen
4. Usuario autoriza → Google redirige de vuelta
5. Better Auth busca/crea usuario (email + username del prefijo del email)
6. Crea sesión → /home
```

---

## 5. ESTADO ACTUAL: LO QUE FALTA / MEJORAS POTENCIALES

### 5.1 Funcionalidades NO implementadas

| Funcionalidad | Estado | Prioridad sugerida |
|--------------|--------|-------------------|
| Login con GitHub | Tipos definidos pero sin plugin server-side ni botón UI | Baja |
| Invitación por email a registrarse | No existe. Las invitaciones son solo para unirse a organizaciones de usuarios ya registrados | Media |
| Phone/SMS 2FA | Solo se usa TOTP (app autenticadora). No hay SMS OTP | Baja |
| Passkeys (WebAuthn) | Better Auth lo soporta pero no está configurado | Baja |
| Verificación por SMS | No implementado | Baja |
| Política de contraseñas configurable | Está hardcodeado en Zod schema. No hay admin panel para cambiarlo | Baja |
| Bloqueo de cuenta tras múltiples intentos | Rate limiting global con Redis, pero no bloqueo por usuario específico | Baja |

### 5.2 Posibles mejoras técnicas

| Área | Observación |
|------|-------------|
| **Admin — Dashboard de actividad** | No hay panel de monitoreo de sesiones/registros/login attempts |
| **Logs de auditoría** | No hay registro de acciones sensibles (cambios de rol, bans, eliminaciones) |
| **Email de bienvenida** | Solo se envía el email de verificación. No hay email de bienvenida post-verificación |
| **Internacionalización (i18n)** | Todos los mensajes están en español hardcodeados |
| **Tests** | No se encontraron tests del sistema de auth (unitarios o e2e) |

### 5.3 Riesgos identificados

| Riesgo | Nivel | Descripción |
|--------|-------|-------------|
| Email de verificación cae en spam | Medio | Resend usa `onboarding@resend.dev` como remitente. En producción debería ser un dominio verificado propio |
| Sin límite de reenvío de verificación | Bajo | El botón "Reenviar correo" en el toast puede presionarse múltiples veces |
| Sesiones no caducan por inactividad | Bajo | Better Auth maneja expiración pero no hay configuración explícita de tiempo máximo de sesión |
| Token de restablecimiento expuesto en URL | Bajo | El token viaja como query param (es JWT, pero visible en historial/logs de servidor) |

---

## 6. RESUMEN PARA TOMAR DECISIONES

### ¿Qué está listo para producción?

| Componente | Estado |
|-----------|--------|
| Registro con email | ✅ Listo |
| Registro con Google | ✅ Listo |
| Login con credenciales | ✅ Listo |
| Login con magic link | ✅ Listo |
| Login con Google | ✅ Listo |
| Recuperación de contraseña | ✅ Listo |
| 2FA (TOTP) | ✅ Listo |
| Códigos de respaldo 2FA | ✅ Listo |
| Verificación de email | ✅ Listo |
| Organizaciones / equipos | ✅ Listo |
| Roles y permisos (RBAC) | ✅ Listo |
| Panel de administración | ✅ Listo |
| Gestión de sesiones | ✅ Listo |
| Protección de rutas | ✅ Listo |

### Stack tecnológico del auth

```
Better Auth (framework)  ←  Drizzle ORM  ←  Neon PostgreSQL
                         ←  Redis (Upstash) para rate limiting
                         ←  Resend (emails transaccionales)
                         ←  Google OAuth 2.0
                         ←  Have I Been Pwned API (passwords)
```

### URL del endpoint principal

Todas las operaciones de auth pasan por: **`/api/auth/[...all]`**

Endpoints específicos (gestionados internamente por Better Auth):
- `POST /api/auth/sign-up/email`
- `POST /api/auth/sign-in/username`
- `POST /api/auth/sign-in/social`
- `POST /api/auth/sign-in/magic-link`
- `POST /api/auth/request-password-reset`
- `POST /api/auth/reset-password`
- `GET /api/auth/verify-email`
- `POST /api/auth/two-factor/verify-totp`
- `GET /api/auth/get-session`
- `POST /api/auth/sign-out`
