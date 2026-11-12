import { useMemo } from "react";

import { useSession } from "@/shared/hooks/use-session";
import { useAccess } from "@/shared/hooks/use-access";
import {
  getMenuItemsForAccess,
  getMenuItemsForGuest,
} from "@/shared/constants/menu";
import type { MenuItem } from "@/shared/constants/menu";

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

const convertMenuItemToNavLink = (item: MenuItem): NavLink => ({
  href: item.href,
  label: item.label,
  icon: <item.icon />,
  description: item.description,
});

export const useAppSidebar = () => {
  const {
    data: session,
    isSuccess: isSessionSuccess,
    isLoading: isSessionLoading,
    isError: isSessionError,
    refetch: refetchSession,
    isRefetching: isSessionRefetching,
  } = useSession();

  const { data: access, isLoading: isAccessLoading } = useAccess();

  // Sin sesión = invitado (navegación pública de solo lectura)
  const isGuest = isSessionSuccess && !session;

  const links = useMemo(() => {
    if (isGuest) return getMenuItemsForGuest().map(convertMenuItemToNavLink);

    // Mientras se cargan los permisos no se muestra nada para evitar parpadeos
    if (!access || !access.isAuthenticated) return [];

    return getMenuItemsForAccess(access).map(convertMenuItemToNavLink);
  }, [isGuest, access]);

  return {
    links,
    session,
    isGuest,
    isSessionSuccess,
    isSessionLoading: isSessionLoading || (!isGuest && isAccessLoading),
    isSessionError,
    refetchSession,
    isSessionRefetching,
  };
};
