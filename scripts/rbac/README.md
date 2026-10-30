# Pruebas RBAC

Scripts para preparar datos de prueba y validar los roles y permisos descritos en
[`docs/RBAC.md`](../../docs/RBAC.md).

| Archivo | Para qué |
|---|---|
| `normalize-roles.sql` | Normaliza roles heredados (`user.role` solo `user`/`admin`; vendedores globales pasan a `seller` en sus comunas). Idempotente. |
| `seed-test-users.ts` | Crea/actualiza las cuentas de prueba (`admin`, `owner2`, `vendedor2`, `miembro`) y algunos ítems de La libertad. Idempotente. |
| `harness.mjs` | Arnés: inicia sesión como cualquier cuenta y llama páginas, endpoints `/api/auth/*` y server actions directamente (sin la UI). |
| `rbac-suite.mjs` | Batería completa (≈190 verificaciones) por rol, incluidas regresiones de cada hallazgo (`rbac-regressions.mjs`). Crea sus propios ítems `RBAC-SUITE …` y los borra al terminar. |

## Ejecutar

```bash
npx tsx scripts/rbac/seed-test-users.ts
npm run build
npm run start
TEST_PASSWORD='<contraseña de las cuentas de prueba>' node scripts/rbac/rbac-suite.mjs
```

En Git Bash (Windows) exporta antes `MSYS_NO_PATHCONV=1` para que rutas como `/admin` no se
conviertan en rutas de Windows. La batería usa una BD real: ejecútala solo contra la base de
desarrollo.
