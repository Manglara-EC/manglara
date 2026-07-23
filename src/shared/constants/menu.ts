/**
 * Configuración de estructura de menú basada en roles
 * Menú centralizado y type-safe
 */

import {
  BarChart3Icon,
  BoxIcon,
  PlusIcon,
  ShoppingBagIcon,
  SettingsIcon,
  LayoutDashboardIcon,
  BuildingIcon,
  ShoppingCartIcon,
} from "lucide-react";

import { UserRole } from "@/shared/constants/roles";

export interface MenuItem {
  /** ID único del item de menú */
  id: string;
  /** Label para mostrar al usuario */
  label: string;
  /** Icono de lucide-react */
  icon: React.ComponentType<{ className?: string }>;
  /** Ruta a la que navega */
  href: string;
  /** Roles que tienen acceso a este item */
  allowedRoles: UserRole[];
  /** Descripción tooltip (opcional) */
  description?: string;
  /** Items de submenu (opcional) */
  subItems?: MenuItem[];
  /** Mostrar un badge de "nuevo" (opcional) */
  isNew?: boolean;
}

/**
 * MENÚ PRINCIPAL - Configuración de estructura de menú por rol
 * Cualquier item aquí será visible solo si el usuario tiene un rol en allowedRoles
 */
export const MENU_CONFIG: MenuItem[] = [
  // ============================================================
  // MENÚ UNIVERSAL (Todos los usuarios)
  // ============================================================
  {
    id: "home",
    label: "Inicio",
    icon: LayoutDashboardIcon,
    href: "/home",
    allowedRoles: [UserRole.USER, UserRole.SELLER, UserRole.ADMIN],
    description: "Vuelve al inicio",
  },

  {
    id: "explore",
    label: "Explorar",
    icon: ShoppingBagIcon,
    href: "/explore",
    allowedRoles: [UserRole.USER, UserRole.SELLER, UserRole.ADMIN],
    description: "Explora productos y servicios",
  },

  {
    id: "cart",
    label: "Carrito",
    icon: ShoppingCartIcon,
    href: "/cart",
    allowedRoles: [UserRole.USER, UserRole.SELLER, UserRole.ADMIN],
    description: "Revisa tu carrito de compras",
  },

  // ============================================================
  // MENÚ SELLER (Solo vendedores)
  // ============================================================
  {
    id: "seller-dashboard",
    label: "Dashboard",
    icon: BarChart3Icon,
    href: "/seller/dashboard",
    allowedRoles: [UserRole.SELLER, UserRole.ADMIN],
    description: "Panel de control del vendedor",
    isNew: false,
  },

  {
    id: "seller-products",
    label: "Mis Productos",
    icon: BoxIcon,
    href: "/seller/products",
    allowedRoles: [UserRole.SELLER, UserRole.ADMIN],
    description: "Gestiona tus productos",
  },

  {
    id: "seller-services",
    label: "Mis Servicios",
    icon: ShoppingBagIcon,
    href: "/seller/services",
    allowedRoles: [UserRole.SELLER, UserRole.ADMIN],
    description: "Gestiona tus servicios",
  },

  {
    id: "seller-create",
    label: "Crear",
    icon: PlusIcon,
    href: "#",
    allowedRoles: [UserRole.SELLER, UserRole.ADMIN],
    description: "Crear nuevo producto o servicio",
    subItems: [
      {
        id: "create-product",
        label: "Crear Producto",
        icon: PlusIcon,
        href: "/seller/products/create",
        allowedRoles: [UserRole.SELLER, UserRole.ADMIN],
        description: "Crea un nuevo producto",
        isNew: true,
      },
      {
        id: "create-service",
        label: "Crear Servicio",
        icon: PlusIcon,
        href: "/seller/services/create",
        allowedRoles: [UserRole.SELLER, UserRole.ADMIN],
        description: "Crea un nuevo servicio",
        isNew: true,
      },
    ],
  },

  // ============================================================
  // MENÚ ADMIN (Solo administradores)
  // ============================================================
  {
    id: "admin-dashboard",
    label: "Admin",
    icon: LayoutDashboardIcon,
    href: "/admin",
    allowedRoles: [UserRole.ADMIN],
    description: "Panel administrativo",
  },

  // ============================================================
  // MENÚ UNIVERSAL (Bottom)
  // ============================================================
  {
    id: "organizations",
    label: "Organizaciones",
    icon: BuildingIcon,
    href: "/organizations",
    allowedRoles: [UserRole.USER, UserRole.SELLER, UserRole.ADMIN],
    description: "Mis organizaciones",
  },

  {
    id: "settings",
    label: "Configuración",
    icon: SettingsIcon,
    href: "/settings",
    allowedRoles: [UserRole.USER, UserRole.SELLER, UserRole.ADMIN],
    description: "Configuración de cuenta",
  },
];

/**
 * Obtiene los items de menú que un usuario puede ver
 * Filtra basado en el rol del usuario
 */
export const getMenuItemsForRole = (userRole: UserRole | null): MenuItem[] => {
  if (!userRole) return [];

  return MENU_CONFIG.filter((item) => item.allowedRoles.includes(userRole)).map(
    (item) => ({
      ...item,
      // Recursivamente filtra subitems
      subItems: item.subItems
        ? item.subItems.filter((subItem) =>
            subItem.allowedRoles.includes(userRole),
          )
        : undefined,
    }),
  );
};

/**
 * Obtiene un item específico del menú
 */
export const getMenuItemById = (id: string): MenuItem | undefined => {
  const findItem = (items: MenuItem[]): MenuItem | undefined => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.subItems) {
        const found = findItem(item.subItems);
        if (found) return found;
      }
    }
    return undefined;
  };

  return findItem(MENU_CONFIG);
};

/**
 * Verifica si un item está visible para un rol específico
 */
export const isMenuItemVisible = (
  itemId: string,
  userRole: UserRole | null,
): boolean => {
  if (!userRole) return false;

  const item = getMenuItemById(itemId);
  if (!item) return false;

  return item.allowedRoles.includes(userRole);
};
