import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useSession } from "@/shared/hooks/use-session";
import { useUserRole } from "@/shared/hooks/use-user-role";
import {
  getMenuItemsForGuest,
  getMenuItemsForRole,
} from "@/shared/constants/menu";
import type { MenuItem } from "@/shared/constants/menu";
import { UserRole } from "@/shared/constants/roles";
import { canAccessOrganizations } from "@/features/organizations/actions/can-access-organizations";

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
  const { data: canAccessCommunes = false, isLoading: isCommuneAccessLoading } =
    useQuery({
      queryKey: ["organization", "can-access", session?.user.id],
      queryFn: canAccessOrganizations,
      enabled: Boolean(session) && role === UserRole.USER,
    });

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
    if (role === UserRole.USER && canAccessCommunes) {
      const communes = getMenuItemsForRole(UserRole.SELLER).find(
        (item) => item.id === "organizations",
      );
      if (communes) menuItems.push(communes);
    }

    // Convertir a NavLink, excluyendo items con subitems
    // (ya que el sidebar plano no los maneja)
    const navLinks: NavLink[] = menuItems
      .filter((item) => !item.subItems || item.subItems.length === 0)
      .map(convertMenuItemToNavLink);

    return navLinks;
  }, [isGuest, role, isRoleLoading, canAccessCommunes]);

  return {
    links,
    session,
    isGuest,
    isSessionSuccess,
    isSessionLoading:
      isSessionLoading ||
      (!isGuest && (isRoleLoading || isCommuneAccessLoading)),
    isSessionError,
    refetchSession,
    isSessionRefetching,
  };
};
