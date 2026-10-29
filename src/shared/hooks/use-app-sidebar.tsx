import { useMemo } from "react";

import { useSession } from "@/shared/hooks/use-session";
import { useUserRole } from "@/shared/hooks/use-user-role";
import {
  getMenuItemsForGuest,
  getMenuItemsForRole,
} from "@/shared/constants/menu";
import type { MenuItem } from "@/shared/constants/menu";

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

export const useAppSidebar = () => {
  const {
    data: session,
    isSuccess: isSessionSuccess,
    isLoading: isSessionLoading,
    isError: isSessionError,
    refetch: refetchSession,
    isRefetching: isSessionRefetching,
  } = useSession();

  const { role, isLoading: isRoleLoading } = useUserRole();

  /**
   * Convierte MenuItem a NavLink para compatibilidad con AppSidebar
   * Solo items sin subitems (items principales navegables)
   */
  const convertMenuItemToNavLink = (item: MenuItem): NavLink => ({
    href: item.href,
    label: item.label,
    icon: <item.icon />,
    description: item.description,
  });

  // Sin sesión = invitado (navegación pública de solo lectura)
  const isGuest = isSessionSuccess && !session;

  const links = useMemo(() => {
    if (isGuest) {
      return getMenuItemsForGuest().map(convertMenuItemToNavLink);
    }

    // Si el rol aún se está cargando, retornar array vacío
    if (!role || isRoleLoading) {
      return [];
    }

    // Obtener items de menú para el rol actual
    const menuItems = getMenuItemsForRole(role);

    // Convertir a NavLink, excluyendo items con subitems
    // (ya que el sidebar plano no los maneja)
    const navLinks: NavLink[] = menuItems
      .filter((item) => !item.subItems || item.subItems.length === 0)
      .map(convertMenuItemToNavLink);

    return navLinks;
  }, [isGuest, role, isRoleLoading]);

  return {
    links,
    session,
    isGuest,
    isSessionSuccess,
    isSessionLoading: isSessionLoading || (!isGuest && isRoleLoading),
    isSessionError,
    refetchSession,
    isSessionRefetching,
  };
};
