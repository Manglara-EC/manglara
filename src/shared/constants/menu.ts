/**
 * Configuración del menú lateral según permisos (RBAC).
 * Cada item declara la capacidad que exige; el menú se calcula a partir del
 * acceso del usuario (rol global + roles por comuna).
 */

import {
  BoxIcon,
  ShoppingBagIcon,
  SettingsIcon,
  LayoutDashboardIcon,
  BuildingIcon,
  ShoppingCartIcon,
  CalendarIcon,
  ShieldCheckIcon,
  StoreIcon,
  BarChart3Icon,
} from "lucide-react";

import { GUEST_ACCESS, type Access } from "@/shared/lib/authz/access";

/**
 * Capacidad requerida para ver un item del menú.
 * - guest: cualquiera, incluso sin sesión.
 * - authenticated: cualquier usuario con sesión.
 * - seller: vende en al menos una comuna (seller/admin/owner).
 * - organizationManager: administra al menos una comuna (owner/admin).
 * - platformAdmin: administrador global.
 */
export type MenuRequirement =
  | "guest"
  | "authenticated"
  | "seller"
  | "organizationManager"
  | "platformAdmin";

export interface MenuItem {
  /** ID único del item de menú */
  id: string;
  /** Label para mostrar al usuario */
  label: string;
  /** Icono de lucide-react */
  icon: React.ComponentType<{ className?: string }>;
  /** Ruta a la que navega */
  href: string;
  /** Capacidad que exige el item */
  requires: MenuRequirement;
  /** Descripción tooltip (opcional) */
  description?: string;
}

export const MENU_CONFIG: MenuItem[] = [
  // Navegación pública
  {
    id: "home",
    label: "Inicio",
    icon: LayoutDashboardIcon,
    href: "/home",
    requires: "guest",
    description: "Vuelve al inicio",
  },
  {
    id: "explore",
    label: "Explorar",
    icon: ShoppingBagIcon,
    href: "/explore",
    requires: "guest",
    description: "Explora productos y servicios",
  },

  // Cliente
  {
    id: "reservations",
    label: "Mis actividades",
    icon: CalendarIcon,
    href: "/reservations",
    requires: "authenticated",
    description: "Consulta tus reservas y compras",
  },
  {
    id: "cart",
    label: "Carrito",
    icon: ShoppingCartIcon,
    href: "/cart",
    requires: "authenticated",
    description: "Revisa tu carrito de compras",
  },

  // Vendedor
  {
    id: "seller-dashboard",
    label: "Dashboard",
    icon: BarChart3Icon,
    href: "/seller/dashboard",
    requires: "seller",
    description: "Panel de control del vendedor",
  },
  {
    id: "seller-products",
    label: "Mis Productos",
    icon: BoxIcon,
    href: "/seller/products",
    requires: "seller",
    description: "Gestiona tus productos",
  },
  {
    id: "seller-services",
    label: "Mis Servicios",
    icon: StoreIcon,
    href: "/seller/services",
    requires: "seller",
    description: "Gestiona tus servicios",
  },

  // Administración
  {
    id: "admin-dashboard",
    label: "Admin",
    icon: ShieldCheckIcon,
    href: "/admin",
    requires: "platformAdmin",
    description: "Panel de administración de la plataforma",
  },

  // Comunas y cuenta
  {
    id: "organizations",
    label: "Comunas",
    icon: BuildingIcon,
    href: "/organizations",
    requires: "authenticated",
    description: "Comunas de Manglara",
  },
  {
    id: "settings",
    label: "Configuración",
    icon: SettingsIcon,
    href: "/settings",
    requires: "authenticated",
    description: "Configuración de cuenta",
  },
];

export const meetsMenuRequirement = (
  access: Access,
  requirement: MenuRequirement,
): boolean => {
  switch (requirement) {
    case "guest":
      return true;
    case "authenticated":
      return access.isAuthenticated;
    case "seller":
      return access.canSell;
    case "organizationManager":
      return access.canManageAnyOrganization;
    case "platformAdmin":
      return access.isPlatformAdmin;
  }
};

/** Items del menú visibles para un acceso dado. */
export const getMenuItemsForAccess = (access: Access): MenuItem[] => {
  const items = MENU_CONFIG.filter((item) =>
    meetsMenuRequirement(access, item.requires),
  );

  // El administrador de comuna tiene un acceso directo a la comuna que gestiona.
  const managed = access.managedOrganizations;
  if (access.isAuthenticated && managed.length > 0) {
    const index = items.findIndex((item) => item.id === "organizations");
    items.splice(index, 0, {
      id: "managed-organization",
      label: managed.length === 1 ? "Mi comuna" : "Mis comunas",
      icon: ShieldCheckIcon,
      href:
        managed.length === 1
          ? `/organizations/${managed[0].organizationSlug}`
          : "/organizations",
      requires: "organizationManager",
      description: "Administra tu comuna: miembros, ítems y aprobaciones",
    });
  }

  return items;
};

export const getMenuItemsForGuest = (): MenuItem[] =>
  getMenuItemsForAccess(GUEST_ACCESS);

export const getMenuItemById = (id: string): MenuItem | undefined =>
  MENU_CONFIG.find((item) => item.id === id);
