/**
 * Definición de roles y constantes de autorización
 * Centro de verdad para gestionar roles en la aplicación
 */

export enum UserRole {
  USER = "user",
  SELLER = "seller",
  ADMIN = "admin",
}

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [UserRole.USER]: "Usuario",
  [UserRole.SELLER]: "Vendedor",
  [UserRole.ADMIN]: "Administrador",
};

/**
 * Permisos basados en roles
 * Define qué acciones puede realizar cada rol
 */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.USER]: ["view_products", "view_services", "purchase"],
  [UserRole.SELLER]: [
    "view_products",
    "view_services",
    "create_product",
    "update_product",
    "delete_product",
    "create_service",
    "update_service",
    "delete_service",
    "view_sales",
    "view_analytics",
  ],
  [UserRole.ADMIN]: [
    "view_products",
    "view_services",
    "create_product",
    "update_product",
    "delete_product",
    "create_service",
    "update_service",
    "delete_service",
    "view_sales",
    "view_analytics",
    "manage_users",
    "manage_roles",
    "view_all_products",
  ],
};

/**
 * Valida si un role es válido
 */
export const isValidRole = (role: unknown): role is UserRole => {
  return Object.values(UserRole).includes(role as UserRole);
};

/**
 * Normaliza un role (maneja inconsistencias de caso)
 * Ej: "SELLER" → "seller", "Seller" → "seller"
 */
export const normalizeRole = (role: string): UserRole | null => {
  const normalized = role.toLowerCase();
  return isValidRole(normalized) ? (normalized as UserRole) : null;
};

/**
 * Verifica si un role tiene un permiso específico
 */
export const hasPermission = (role: UserRole, permission: string): boolean => {
  return ROLE_PERMISSIONS[role].includes(permission);
};

/**
 * Verifica si un usuario con un role puede hacer algo
 */
export const canPerform = (
  userRole: UserRole | null | undefined,
  permission: string,
): boolean => {
  if (!userRole) return false;
  return hasPermission(userRole, permission);
};
