/**
 * Guardas RBAC sobre los endpoints de better-auth.
 *
 * Los endpoints `/api/auth/organization/*` y `/api/auth/admin/*` se pueden
 * llamar directamente desde el navegador, así que las reglas de Manglara se
 * aplican aquí además de en la interfaz. Los roles se leen de la BD (no de la
 * sesión cacheada) para que un cambio de rol surta efecto de inmediato.
 */

import { and, eq } from "drizzle-orm";
import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from "better-auth/api";

import { db } from "@/shared/lib/drizzle/server";
import {
  invitation,
  member,
  organization,
  user,
} from "@/shared/lib/drizzle/schema";
import {
  ASSIGNABLE_ORGANIZATION_ROLES,
  UserRole,
  canManageAs,
  isOrganizationRole,
  normalizeOrganizationRole,
  normalizeUserRole,
  OrganizationRole,
} from "@/shared/constants/roles";

const forbidden = (message: string) =>
  new APIError("FORBIDDEN", { code: "FORBIDDEN", message });

const badRequest = (message: string) =>
  new APIError("BAD_REQUEST", { code: "BAD_REQUEST", message });

/** Endpoints que exponen correos de miembros o invitaciones. */
const MANAGER_ONLY_READ_PATHS = new Set([
  "/organization/get-full-organization",
  "/organization/list-members",
  "/organization/list-invitations",
]);

/**
 * Endpoints que la app gestiona con sus propias server actions (validadas);
 * no se aceptan llamadas directas a better-auth.
 */
const BLOCKED_ORGANIZATION_PATHS: Record<string, string> = {
  "/organization/delete": "Solo el administrador global puede eliminar comunas",
  "/organization/update": "Edita la comuna desde la aplicación",
  // Cambiar roles y quitar miembros va por las acciones de la app, que además
  // garantizan (en una transacción) que la comuna nunca quede sin owner.
  "/organization/update-member-role":
    "Gestiona los miembros desde la aplicación",
  "/organization/remove-member": "Gestiona los miembros desde la aplicación",
};

/** Campos que el panel /admin puede cambiar con /admin/update-user. */
const ADMIN_UPDATABLE_USER_FIELDS = new Set([
  "name",
  "username",
  "displayUsername",
  "email",
  "role",
]);

const GLOBAL_ROLES: readonly UserRole[] = Object.values(UserRole);

/** Rutas del plugin admin que usa el panel /admin (el resto se bloquea). */
const ALLOWED_ADMIN_PATHS = new Set([
  "/admin/list-users",
  "/admin/update-user",
  "/admin/set-role",
  "/admin/ban-user",
  "/admin/unban-user",
  "/admin/remove-user",
]);

const getGlobalRole = async (userId: string) => {
  const [row] = await db
    .select({ role: user.role, banned: user.banned })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!row || row.banned) return null;

  return normalizeUserRole(row.role);
};

const getMemberRole = async (userId: string, organizationId: string) => {
  const [row] = await db
    .select({ role: member.role })
    .from(member)
    .where(
      and(eq(member.userId, userId), eq(member.organizationId, organizationId)),
    )
    .limit(1);

  return row ? normalizeOrganizationRole(row.role) : null;
};

/** Comunas en las que `userId` es el único owner. */
const findCommunitiesWithSoleOwner = async (userId: string) => {
  const owned = await db
    .select({ organizationId: member.organizationId, name: organization.name })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(and(eq(member.userId, userId), eq(member.role, "owner")));

  const names: string[] = [];
  for (const { organizationId, name } of owned) {
    const owners = await db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.organizationId, organizationId),
          eq(member.role, "owner"),
        ),
      );
    if (owners.length <= 1) names.push(name);
  }

  return names;
};

const findOrganizationIdBySlug = async (slug: string) => {
  const [row] = await db
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.slug, slug))
    .limit(1);

  return row?.id ?? null;
};

const isFilled = (value: unknown): value is string =>
  typeof value === "string" && value !== "";

/** Comuna objetivo de las mutaciones (igual que better-auth: id o la activa). */
const resolveOrganizationId = ({
  organizationId,
  activeOrganizationId,
}: {
  organizationId?: unknown;
  activeOrganizationId?: string | null;
}) =>
  isFilled(organizationId) ? organizationId : (activeOrganizationId ?? null);

/**
 * Comuna que consultará una lectura con correos/invitaciones.
 *
 * better-auth no resuelve igual en cada endpoint (unos priorizan el slug,
 * otros el id y otros caen a la comuna activa), así que se exige que la
 * petición nombre exactamente UNA comuna y que coincida con lo que el
 * endpoint usará.
 */
const resolveReadOrganizationId = async (
  path: string,
  query: Record<string, unknown>,
) => {
  const hasId = isFilled(query.organizationId);
  const hasSlug = isFilled(query.organizationSlug);

  if (hasId === hasSlug) {
    throw badRequest("Indica la comuna con organizationId u organizationSlug");
  }

  // list-invitations ignora el slug y usaría la comuna activa
  if (path === "/organization/list-invitations" && !hasId) {
    throw badRequest("Indica la comuna con organizationId");
  }

  return hasId
    ? (query.organizationId as string)
    : await findOrganizationIdBySlug(query.organizationSlug as string);
};

/** Exige un único rol de comuna conocido (sin roles compuestos "a,b"). */
const parseSingleRole = (role: unknown): OrganizationRole => {
  const roles = (Array.isArray(role) ? role : [role])
    .filter((value): value is string => typeof value === "string")
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  if (roles.length !== 1 || !isOrganizationRole(roles[0])) {
    throw badRequest("Asigna un único rol: owner, admin, seller o member");
  }

  return roles[0];
};

const assertCanAssignRole = (
  actorRole: OrganizationRole | null,
  role: OrganizationRole,
) => {
  if (!canManageAs(actorRole)) {
    throw forbidden("Solo los administradores de la comuna pueden hacer esto");
  }

  if (!ASSIGNABLE_ORGANIZATION_ROLES[actorRole!].includes(role)) {
    throw forbidden(`No tienes permiso para asignar el rol "${role}"`);
  }
};

const assertCanManageMember = (
  actorRole: OrganizationRole | null,
  targetRole: OrganizationRole,
) => {
  if (
    !canManageAs(actorRole) ||
    !ASSIGNABLE_ORGANIZATION_ROLES[actorRole!].includes(targetRole)
  ) {
    throw forbidden("No tienes permiso para gestionar a este miembro");
  }
};

export const authorizationGuard = createAuthMiddleware(async (ctx) => {
  const path = ctx.path;
  const isOrganizationPath = path.startsWith("/organization/");
  const isAdminPath = path.startsWith("/admin/");

  if (!isOrganizationPath && !isAdminPath) return;

  const session = await getSessionFromCtx(ctx).catch(() => null);

  // Sin sesión: better-auth responde 401 por su cuenta.
  if (!session) return;

  const userId = session.user.id;
  const globalRole = await getGlobalRole(userId);

  if (!globalRole) throw forbidden("Cuenta no habilitada");

  // Panel de administración global: rol admin vigente en la BD y solo las
  // operaciones que usa el panel (sin suplantación ni cambio de contraseñas).
  if (isAdminPath) {
    if (globalRole !== UserRole.ADMIN) {
      throw forbidden("Solo el administrador global puede hacer esto");
    }
    if (!ALLOWED_ADMIN_PATHS.has(path)) {
      throw forbidden("Operación de administración no habilitada");
    }

    // Solo existen dos roles globales: user y admin
    const adminBody = (ctx.body ?? {}) as {
      role?: unknown;
      data?: { role?: unknown };
    };
    const requestedRole =
      path === "/admin/set-role" ? adminBody.role : adminBody.data?.role;
    if (
      (path === "/admin/set-role" || requestedRole !== undefined) &&
      !GLOBAL_ROLES.includes(requestedRole as UserRole)
    ) {
      throw badRequest("El rol global debe ser user o admin");
    }

    if (path === "/admin/update-user") {
      const fields = Object.keys(
        (adminBody.data as Record<string, unknown> | undefined) ?? {},
      );
      const invalid = fields.filter(
        (field) => !ADMIN_UPDATABLE_USER_FIELDS.has(field),
      );
      if (invalid.length > 0) {
        throw badRequest(`Campos no editables: ${invalid.join(", ")}`);
      }
    }

    // Eliminar la cuenta del único owner dejaría su comuna sin administrador
    if (path === "/admin/remove-user") {
      const targetUserId = (ctx.body as { userId?: unknown } | undefined)
        ?.userId;
      if (typeof targetUserId === "string") {
        const soleOwnerOf = await findCommunitiesWithSoleOwner(targetUserId);
        if (soleOwnerOf.length > 0) {
          throw badRequest(
            `Es el único administrador de: ${soleOwnerOf.join(", ")}. Asigna otro owner antes de eliminar la cuenta.`,
          );
        }
      }
    }
    return;
  }

  if (path in BLOCKED_ORGANIZATION_PATHS) {
    throw forbidden(BLOCKED_ORGANIZATION_PATHS[path]);
  }

  const body = (ctx.body ?? {}) as Record<string, unknown>;
  const query = (ctx.query ?? {}) as Record<string, unknown>;
  const activeOrganizationId = (
    session.session as { activeOrganizationId?: string | null }
  ).activeOrganizationId;

  switch (path) {
    case "/organization/create": {
      if (globalRole !== UserRole.ADMIN) {
        throw forbidden("Solo el administrador global puede crear comunas");
      }
      return;
    }

    case "/organization/invite-member": {
      const role = parseSingleRole(body.role);
      const organizationId = resolveOrganizationId({
        organizationId: body.organizationId,
        activeOrganizationId,
      });
      if (!organizationId) return;

      const actorRole = await getMemberRole(userId, organizationId);
      assertCanAssignRole(actorRole, role);

      // Reinvitar cancela (o con `resend` extiende) la invitación pendiente:
      // solo se permite si el actor también podría gestionar esa invitación.
      if (typeof body.email === "string") {
        const pending = await db
          .select({ role: invitation.role })
          .from(invitation)
          .where(
            and(
              eq(invitation.organizationId, organizationId),
              eq(invitation.email, body.email.toLowerCase()),
              eq(invitation.status, "pending"),
            ),
          );

        for (const existing of pending) {
          assertCanManageMember(
            actorRole,
            normalizeOrganizationRole(existing.role),
          );
        }
      }
      return;
    }

    case "/organization/leave": {
      // Un owner no sale por su cuenta: better-auth cuenta los owners sin
      // bloqueo y una salida simultánea a otra degradación dejaría la comuna
      // sin owner. Otro owner o el admin global lo quitan (acción transaccional).
      if (typeof body.organizationId !== "string") return;

      if (
        (await getMemberRole(userId, body.organizationId)) ===
        OrganizationRole.OWNER
      ) {
        throw forbidden(
          "Un administrador de comuna no puede salir por su cuenta: pide a otro owner o al administrador global que te quite",
        );
      }
      return;
    }

    case "/organization/cancel-invitation": {
      if (typeof body.invitationId !== "string") return;

      const [target] = await db
        .select({
          organizationId: invitation.organizationId,
          role: invitation.role,
        })
        .from(invitation)
        .where(eq(invitation.id, body.invitationId))
        .limit(1);
      if (!target) return;

      // Solo cancela invitaciones de roles que él mismo podría asignar
      assertCanManageMember(
        await getMemberRole(userId, target.organizationId),
        normalizeOrganizationRole(target.role),
      );
      return;
    }
  }

  if (MANAGER_ONLY_READ_PATHS.has(path)) {
    const organizationId = await resolveReadOrganizationId(path, query);
    if (!organizationId) return;

    if (!canManageAs(await getMemberRole(userId, organizationId))) {
      throw forbidden(
        "Solo los administradores de la comuna pueden ver esta información",
      );
    }
  }
});
