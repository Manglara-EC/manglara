/**
 * Autorización en el servidor.
 *
 * La sesión (cacheada en Redis) solo se usa para identificar al usuario. El rol
 * global, el estado de baneo y las membresías se leen SIEMPRE de la BD, así un
 * cambio de rol o una expulsión de la comuna surte efecto de inmediato.
 *
 * Solo debe importarse desde código de servidor (server actions, páginas
 * servidor, route handlers).
 */

import { cache } from "react";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { member, organization, user } from "@/shared/lib/drizzle/schema";
import {
  normalizeOrganizationRole,
  normalizeUserRole,
  type OrganizationRole,
} from "@/shared/constants/roles";
import {
  GUEST_ACCESS,
  buildAccess,
  type Access,
  type AccessMembership,
} from "@/shared/lib/authz/access";

export const loadAccessForUser = async (
  userId: string,
): Promise<Access | null> => {
  const [row] = await db
    .select({ role: user.role, banned: user.banned })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!row || row.banned) return null;

  const memberships: AccessMembership[] = (
    await db
      .select({
        organizationId: organization.id,
        organizationName: organization.name,
        organizationSlug: organization.slug,
        role: member.role,
      })
      .from(member)
      .innerJoin(organization, eq(member.organizationId, organization.id))
      .where(eq(member.userId, userId))
  ).map((m) => ({
    organizationId: m.organizationId,
    organizationName: m.organizationName,
    organizationSlug: m.organizationSlug ?? m.organizationId,
    role: normalizeOrganizationRole(m.role),
  }));

  return buildAccess({
    userId,
    role: normalizeUserRole(row.role),
    memberships,
  });
};

/**
 * Sesión + acceso del usuario actual (memoizado por request).
 * Devuelve `null` si no hay sesión o la cuenta está baneada/eliminada.
 */
export const getViewer = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) return null;

  const access = await loadAccessForUser(session.user.id);

  if (!access) return null;

  return { session, access };
});

/** Acceso del usuario actual; invitados reciben `GUEST_ACCESS`. */
export const getAccess = async (): Promise<Access> =>
  (await getViewer())?.access ?? GUEST_ACCESS;

/** Rol (fresco) de un usuario en una comuna, o `null` si no es miembro. */
export const getOrganizationRoleFromDb = async (
  userId: string,
  organizationId: string,
): Promise<OrganizationRole | null> => {
  const [row] = await db
    .select({ role: member.role })
    .from(member)
    .where(
      and(eq(member.userId, userId), eq(member.organizationId, organizationId)),
    )
    .limit(1);

  return row ? normalizeOrganizationRole(row.role) : null;
};
