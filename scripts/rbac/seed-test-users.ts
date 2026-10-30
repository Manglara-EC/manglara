/**
 * Cuentas y datos de prueba para validar el RBAC (idempotente).
 *
 *   npx tsx scripts/rbac/seed-test-users.ts
 *
 * Contraseña de las cuentas nuevas: variable TEST_PASSWORD (usa la misma que el
 * equipo ya comparte para las cuentas owner/user/vendedor). No la versiones.
 *
 * | usuario   | rol global | rol por comuna                              |
 * |-----------|------------|---------------------------------------------|
 * | admin     | admin      | —                                           |
 * | owner     | user       | admin en playas, owner en prueba y libertad |
 * | owner1    | user       | owner en playas                             |
 * | owner2    | user       | owner en libertad                           |
 * | vendedor  | user       | seller en playas                            |
 * | vendedor2 | user       | seller en libertad                          |
 * | miembro   | user       | member en playas                            |
 * | user      | user       | —                                           |
 */

import { loadEnvConfig } from "@next/env";
import { Pool } from "@neondatabase/serverless";
import { hashPassword } from "better-auth/crypto";

loadEnvConfig(process.cwd());

const PASSWORD = process.env.TEST_PASSWORD ?? "";

if (!PASSWORD) {
  throw new Error(
    "Define TEST_PASSWORD con la contraseña de las cuentas de prueba",
  );
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

const q = async <T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
) => (await pool.query(sql, params)).rows as T[];

const newId = () => crypto.randomUUID().replace(/-/g, "");

async function ensureUser(
  username: string,
  name: string,
  role: "user" | "admin",
) {
  const [existing] = await q<{ id: string }>(
    `select id from "user" where username = $1`,
    [username],
  );

  if (existing) {
    await q(`update "user" set role = $2, updated_at = now() where id = $1`, [
      existing.id,
      role,
    ]);
    return existing.id;
  }

  const userId = newId();

  await q(
    `insert into "user" (id, name, email, email_verified, created_at, updated_at, username, display_username, role, banned)
     values ($1, $2, $3, true, now(), now(), $4, $4, $5, false)`,
    [userId, name, `${username}.manglara@yopmail.com`, username, role],
  );
  await q(
    `insert into account (id, account_id, provider_id, user_id, password, created_at, updated_at)
     values ($1, $2, 'credential', $2, $3, now(), now())`,
    [newId(), userId, await hashPassword(PASSWORD)],
  );

  console.log(`+ usuario ${username} (${role})`);

  return userId;
}

async function getOrganizationId(slug: string) {
  const [org] = await q<{ id: string }>(
    `select id from organization where slug = $1`,
    [slug],
  );

  if (!org) throw new Error(`No existe la comuna ${slug}`);

  return org.id;
}

async function ensureMember(
  userId: string,
  organizationId: string,
  role: string,
) {
  const [existing] = await q<{ id: string }>(
    `select id from member where user_id = $1 and organization_id = $2`,
    [userId, organizationId],
  );

  if (existing) {
    await q(`update member set role = $2 where id = $1`, [existing.id, role]);
    return;
  }

  await q(
    `insert into member (id, organization_id, user_id, role, created_at) values ($1, $2, $3, $4, now())`,
    [newId(), organizationId, userId, role],
  );
}

async function ensureProduct(
  sellerId: string,
  organizationId: string,
  name: string,
  status: "pending" | "approved" | "rejected",
) {
  const [existing] = await q(
    `select id from product where name = $1 and seller_id = $2 and deleted = false`,
    [name, sellerId],
  );

  if (existing) return;

  await q(
    `insert into product (id, name, description, price, stock, seller_id, organization_id, status, deleted, created_at, updated_at, rejection_reason)
     values ($1, $2, $3, 15.50, 10, $4, $5, $6, false, now(), now(), $7)`,
    [
      crypto.randomUUID(),
      name,
      `Producto de prueba RBAC (${status})`,
      sellerId,
      organizationId,
      status,
      status === "rejected" ? "Fotos poco claras (prueba)" : null,
    ],
  );
}

async function ensureService(
  sellerId: string,
  organizationId: string,
  name: string,
  status: "pending" | "approved",
) {
  const [existing] = await q(
    `select id from service where name = $1 and seller_id = $2 and deleted = false`,
    [name, sellerId],
  );

  if (existing) return;

  await q(
    `insert into service (id, name, description, service_type, price, price_unit, max_capacity, seller_id, organization_id, status, deleted, created_at, updated_at)
     values ($1, $2, $3, 'activity', 25.00, 'person', 8, $4, $5, $6, false, now(), now())`,
    [
      crypto.randomUUID(),
      name,
      `Servicio de prueba RBAC (${status})`,
      sellerId,
      organizationId,
      status,
    ],
  );
}

async function main() {
  // Cuentas entregadas por el equipo: ninguna es administrador global
  for (const username of ["owner", "owner1", "vendedor", "user"]) {
    await q(
      `update "user" set role = 'user', updated_at = now() where username = $1`,
      [username],
    );
  }

  await ensureUser("admin", "Administrador Global", "admin");
  const owner2 = await ensureUser("owner2", "Admin Comuna Libertad", "user");
  const vendedor2 = await ensureUser("vendedor2", "Vendedor Libertad", "user");
  const miembro = await ensureUser("miembro", "Miembro Playas", "user");

  const playas = await getOrganizationId("playas");
  const libertad = await getOrganizationId("libertad");

  await ensureMember(owner2, libertad, "owner");
  await ensureMember(vendedor2, libertad, "seller");
  await ensureMember(miembro, playas, "member");

  const [vendedor] = await q<{ id: string }>(
    `select id from "user" where username = 'vendedor'`,
  );
  if (vendedor) await ensureMember(vendedor.id, playas, "seller");

  await ensureProduct(
    vendedor2,
    libertad,
    "Cerámica Libertad (pendiente)",
    "pending",
  );
  await ensureProduct(
    vendedor2,
    libertad,
    "Cerámica Libertad (aprobada)",
    "approved",
  );
  await ensureProduct(
    vendedor2,
    libertad,
    "Cerámica Libertad (rechazada)",
    "rejected",
  );
  await ensureService(
    vendedor2,
    libertad,
    "Tour manglar Libertad (pendiente)",
    "pending",
  );
  await ensureService(
    vendedor2,
    libertad,
    "Tour manglar Libertad (aprobado)",
    "approved",
  );

  console.log("Datos de prueba RBAC listos");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
