/**
 * Definición de roles y permisos (RBAC) — fuente única de verdad.
 *
 * Manglara usa dos niveles de rol:
 *
 * 1. Rol global (`user.role`): qué es la persona en toda la plataforma.
 *    - `user`  → cliente / turista (valor por defecto de toda cuenta).
 *    - `admin` → administrador global (equipo de Manglara).
 *    Cualquier otro valor heredado (`seller`, `owner`...) se trata como `user`.
 *
 * 2. Rol en la comuna (`member.role`): qué puede hacer dentro de UNA comuna.
 *    - `owner`  → administrador de la comuna (líder comunitario).
 *    - `admin`  → co-administrador de la comuna.
 *    - `seller` → vendedor de la comuna.
 *    - `member` → miembro sin permisos de venta.
 *
 * Un administrador de comuna solo administra las comunas donde tiene rol
 * `owner`/`admin`; nunca obtiene permisos sobre otras comunas ni sobre la
 * plataforma.
 */

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

export enum OrganizationRole {
  OWNER = "owner",
  ADMIN = "admin",
  SELLER = "seller",
  MEMBER = "member",
}

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [UserRole.USER]: "Usuario",
  [UserRole.ADMIN]: "Administrador global",
};

export const ORGANIZATION_ROLE_DISPLAY_NAMES: Record<OrganizationRole, string> =
  {
    [OrganizationRole.OWNER]: "Administrador de comuna",
    [OrganizationRole.ADMIN]: "Co-administrador",
    [OrganizationRole.SELLER]: "Vendedor",
    [OrganizationRole.MEMBER]: "Miembro",
  };

/** Roles de comuna que pueden publicar y gestionar sus propios ítems. */
export const SELLING_ORGANIZATION_ROLES: readonly OrganizationRole[] = [
  OrganizationRole.OWNER,
  OrganizationRole.ADMIN,
  OrganizationRole.SELLER,
];

/** Roles de comuna que administran la comuna (miembros, ítems, datos). */
export const MANAGING_ORGANIZATION_ROLES: readonly OrganizationRole[] = [
  OrganizationRole.OWNER,
  OrganizationRole.ADMIN,
];

/**
 * Roles que cada rol de comuna puede asignar (invitar o cambiar) y, a la vez,
 * los roles de los miembros que puede modificar o quitar.
 * El administrador global puede asignar cualquiera.
 */
export const ASSIGNABLE_ORGANIZATION_ROLES: Record<
  OrganizationRole,
  readonly OrganizationRole[]
> = {
  [OrganizationRole.OWNER]: [
    OrganizationRole.OWNER,
    OrganizationRole.ADMIN,
    OrganizationRole.SELLER,
    OrganizationRole.MEMBER,
  ],
  [OrganizationRole.ADMIN]: [OrganizationRole.SELLER, OrganizationRole.MEMBER],
  [OrganizationRole.SELLER]: [],
  [OrganizationRole.MEMBER]: [],
};

/**
 * Permisos de alcance global (no dependen de una comuna).
 */
export const GLOBAL_PERMISSIONS = [
  "catalog:view",
  "cart:use",
  "order:create",
  "booking:create",
  "activity:view_own",
  "account:manage",
  "organization:view_directory",
  "invitation:respond",
  "platform:access_admin_panel",
  "platform:manage_users",
  "organization:create",
  "organization:delete",
  "organization:manage_any",
  "item:moderate_any",
] as const;

export type GlobalPermission = (typeof GLOBAL_PERMISSIONS)[number];

/**
 * Permisos con alcance de comuna: se evalúan contra el rol en ESA comuna.
 */
export const ORGANIZATION_PERMISSIONS = [
  "organization:view_members",
  "organization:view_member_emails",
  "organization:update",
  "organization:view_stats",
  "invitation:create",
  "invitation:cancel",
  "member:update_role",
  "member:remove",
  "item:create",
  "item:update_own",
  "item:delete_own",
  "item:view_all",
  "item:moderate",
  "item:delete_any",
] as const;

export type OrganizationPermission = (typeof ORGANIZATION_PERMISSIONS)[number];

const CUSTOMER_PERMISSIONS: GlobalPermission[] = [
  "catalog:view",
  "cart:use",
  "order:create",
  "booking:create",
  "activity:view_own",
  "account:manage",
  "organization:view_directory",
  "invitation:respond",
];

export const GLOBAL_ROLE_PERMISSIONS: Record<UserRole, GlobalPermission[]> = {
  [UserRole.USER]: CUSTOMER_PERMISSIONS,
  [UserRole.ADMIN]: [
    ...CUSTOMER_PERMISSIONS,
    "platform:access_admin_panel",
    "platform:manage_users",
    "organization:create",
    "organization:delete",
    "organization:manage_any",
    "item:moderate_any",
  ],
};

/** Permisos de un invitado (sin sesión): solo lectura del catálogo público. */
export const GUEST_PERMISSIONS: GlobalPermission[] = ["catalog:view"];

const SELLER_ORGANIZATION_PERMISSIONS: OrganizationPermission[] = [
  "organization:view_members",
  "item:create",
  "item:update_own",
  "item:delete_own",
];

export const ORGANIZATION_ROLE_PERMISSIONS: Record<
  OrganizationRole,
  OrganizationPermission[]
> = {
  [OrganizationRole.OWNER]: [
    ...SELLER_ORGANIZATION_PERMISSIONS,
    "organization:view_member_emails",
    "organization:update",
    "organization:view_stats",
    "invitation:create",
    "invitation:cancel",
    "member:update_role",
    "member:remove",
    "item:view_all",
    "item:moderate",
    "item:delete_any",
  ],
  [OrganizationRole.ADMIN]: [
    ...SELLER_ORGANIZATION_PERMISSIONS,
    "organization:view_member_emails",
    "organization:update",
    "organization:view_stats",
    "invitation:create",
    "invitation:cancel",
    "member:update_role",
    "member:remove",
    "item:view_all",
    "item:moderate",
    "item:delete_any",
  ],
  [OrganizationRole.SELLER]: SELLER_ORGANIZATION_PERMISSIONS,
  [OrganizationRole.MEMBER]: ["organization:view_members"],
};

/**
 * Permisos de comuna que el administrador global tiene en CUALQUIER comuna
 * (moderación y gestión), aunque no sea miembro. No incluye vender.
 */
export const PLATFORM_ADMIN_ORGANIZATION_PERMISSIONS: OrganizationPermission[] =
  [
    "organization:view_members",
    "organization:view_member_emails",
    "organization:update",
    "organization:view_stats",
    "member:update_role",
    "member:remove",
    "item:view_all",
    "item:moderate",
    "item:delete_any",
  ];

/**
 * Normaliza el rol global. Solo `admin` es privilegiado; cualquier otro valor
 * (incluidos valores heredados como `seller` u `owner`) equivale a `user`.
 */
export const normalizeUserRole = (role: unknown): UserRole =>
  typeof role === "string" && role.trim().toLowerCase() === UserRole.ADMIN
    ? UserRole.ADMIN
    : UserRole.USER;

export const isOrganizationRole = (role: unknown): role is OrganizationRole =>
  Object.values(OrganizationRole).includes(role as OrganizationRole);

/** De mayor a menor privilegio. */
const ORGANIZATION_ROLE_PRECEDENCE: readonly OrganizationRole[] = [
  OrganizationRole.OWNER,
  OrganizationRole.ADMIN,
  OrganizationRole.SELLER,
  OrganizationRole.MEMBER,
];

/**
 * Normaliza un rol de comuna; valores desconocidos equivalen a `member`.
 * Un rol compuesto heredado ("owner,member") cuenta como el de mayor
 * privilegio, para que nunca se gestione como si fuera menor.
 */
export const normalizeOrganizationRole = (role: unknown): OrganizationRole => {
  const parts =
    typeof role === "string"
      ? role.split(",").map((part) => part.trim().toLowerCase())
      : [];

  return (
    ORGANIZATION_ROLE_PRECEDENCE.find((candidate) =>
      parts.includes(candidate),
    ) ?? OrganizationRole.MEMBER
  );
};

export const hasGlobalPermission = (
  role: UserRole | null | undefined,
  permission: GlobalPermission,
): boolean =>
  role ? GLOBAL_ROLE_PERMISSIONS[role].includes(permission) : false;

export const hasOrganizationPermission = (
  role: OrganizationRole | null | undefined,
  permission: OrganizationPermission,
): boolean =>
  role ? ORGANIZATION_ROLE_PERMISSIONS[role].includes(permission) : false;

export const canSellAs = (role: OrganizationRole | null | undefined) =>
  !!role && SELLING_ORGANIZATION_ROLES.includes(role);

export const canManageAs = (role: OrganizationRole | null | undefined) =>
  !!role && MANAGING_ORGANIZATION_ROLES.includes(role);

/**
 * ¿Puede `actorRole` asignar `role` (al invitar o al cambiar un rol)?
 * Con `isPlatformAdmin` cualquier rol es asignable.
 */
export const canAssignOrganizationRole = (
  actorRole: OrganizationRole | null | undefined,
  role: OrganizationRole,
  isPlatformAdmin = false,
): boolean =>
  isPlatformAdmin ||
  (!!actorRole && ASSIGNABLE_ORGANIZATION_ROLES[actorRole].includes(role));
