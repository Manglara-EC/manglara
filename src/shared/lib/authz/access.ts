/**
 * Modelo de acceso del usuario actual (RBAC).
 *
 * Funciones puras: se usan en el servidor (para autorizar) y en el cliente
 * (para decidir qué mostrar). El cliente nunca es la barrera de seguridad;
 * cada server action vuelve a evaluar estas reglas con datos frescos de la BD.
 */

import {
  GLOBAL_ROLE_PERMISSIONS,
  GUEST_PERMISSIONS,
  ORGANIZATION_ROLE_PERMISSIONS,
  PLATFORM_ADMIN_ORGANIZATION_PERMISSIONS,
  UserRole,
  canManageAs,
  canSellAs,
  type GlobalPermission,
  type OrganizationPermission,
  type OrganizationRole,
} from "@/shared/constants/roles";

/** Clave de React Query del acceso del usuario actual. */
export const ACCESS_QUERY_KEY = ["session", "access"] as const;

export interface AccessMembership {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: OrganizationRole;
}

export interface Access {
  isAuthenticated: boolean;
  userId: string | null;
  /** Rol global normalizado; `null` para invitados. */
  role: UserRole | null;
  isPlatformAdmin: boolean;
  memberships: AccessMembership[];
  /** Comunas donde puede publicar productos/servicios. */
  sellingOrganizations: AccessMembership[];
  /** Comunas que administra (owner/admin). */
  managedOrganizations: AccessMembership[];
  canSell: boolean;
  canManageAnyOrganization: boolean;
  permissions: GlobalPermission[];
}

export const GUEST_ACCESS: Access = {
  isAuthenticated: false,
  userId: null,
  role: null,
  isPlatformAdmin: false,
  memberships: [],
  sellingOrganizations: [],
  managedOrganizations: [],
  canSell: false,
  canManageAnyOrganization: false,
  permissions: GUEST_PERMISSIONS,
};

export const buildAccess = ({
  userId,
  role,
  memberships,
}: {
  userId: string;
  role: UserRole;
  memberships: AccessMembership[];
}): Access => {
  const isPlatformAdmin = role === UserRole.ADMIN;
  const sellingOrganizations = memberships.filter((m) => canSellAs(m.role));
  const managedOrganizations = memberships.filter((m) => canManageAs(m.role));

  return {
    isAuthenticated: true,
    userId,
    role,
    isPlatformAdmin,
    memberships,
    sellingOrganizations,
    managedOrganizations,
    canSell: sellingOrganizations.length > 0,
    canManageAnyOrganization:
      isPlatformAdmin || managedOrganizations.length > 0,
    permissions: GLOBAL_ROLE_PERMISSIONS[role],
  };
};

export const can = (access: Access, permission: GlobalPermission) =>
  access.permissions.includes(permission);

export const getOrganizationRole = (
  access: Access,
  organizationId: string,
): OrganizationRole | null =>
  access.memberships.find((m) => m.organizationId === organizationId)?.role ??
  null;

/**
 * Permisos efectivos en una comuna: los de su rol en ella más los del
 * administrador global (que modera y gestiona cualquier comuna, sin vender).
 */
export const getOrganizationPermissions = (
  access: Access,
  organizationId: string,
): OrganizationPermission[] => {
  const role = getOrganizationRole(access, organizationId);
  const fromRole = role ? ORGANIZATION_ROLE_PERMISSIONS[role] : [];
  const fromPlatform = access.isPlatformAdmin
    ? PLATFORM_ADMIN_ORGANIZATION_PERMISSIONS
    : [];

  return Array.from(new Set([...fromRole, ...fromPlatform]));
};

export const canInOrganization = (
  access: Access,
  organizationId: string,
  permission: OrganizationPermission,
) => getOrganizationPermissions(access, organizationId).includes(permission);

/** Datos mínimos de un producto/servicio para decidir permisos. */
export interface ItemScope {
  sellerId: string;
  organizationId: string;
  status: string;
}

/** Estados en los que el vendedor puede eliminar su propio ítem. */
export const SELLER_DELETABLE_STATUSES = ["pending", "rejected"] as const;

export const isOwnItem = (access: Access, item: ItemScope) =>
  !!access.userId && item.sellerId === access.userId;

/** Ver un ítem en cualquier estado (revisión/moderación). */
export const canReviewItem = (access: Access, item: ItemScope) =>
  canInOrganization(access, item.organizationId, "item:view_all");

/** Aprobar o rechazar: moderadores de la comuna, nunca sobre lo propio. */
export const canModerateItem = (access: Access, item: ItemScope) =>
  !isOwnItem(access, item) &&
  canInOrganization(access, item.organizationId, "item:moderate");

/** Editar contenido: solo el vendedor dueño, si aún puede vender en la comuna. */
export const canEditItem = (access: Access, item: ItemScope) =>
  isOwnItem(access, item) &&
  canInOrganization(access, item.organizationId, "item:update_own");

export const canDeleteItem = (access: Access, item: ItemScope) =>
  canInOrganization(access, item.organizationId, "item:delete_any") ||
  (isOwnItem(access, item) &&
    canInOrganization(access, item.organizationId, "item:delete_own") &&
    (SELLER_DELETABLE_STATUSES as readonly string[]).includes(item.status));
