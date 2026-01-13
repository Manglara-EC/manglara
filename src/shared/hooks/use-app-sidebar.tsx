import { useMemo } from "react";
import {
  HomeIcon,
  SearchIcon,
  UserRoundIcon,
  SettingsIcon,
  UserRoundCogIcon,
  Building2Icon,
} from "lucide-react";

import { useSession } from "@/shared/hooks/use-session";

export const useAppSidebar = () => {
  const {
    data: session,
    isSuccess: isSessionSuccess,
    isLoading: isSessionLoading,
    isError: isSessionError,
    refetch: refetchSession,
    isRefetching: isSessionRefetching,
  } = useSession();

  const links = useMemo(() => {
    const baseLinks = [
      { href: "/home", label: "Inicio", icon: <HomeIcon /> },
      {
        href: "/explore",
        label: "Explorar",
        icon: <SearchIcon />,
      },
      {
        href: "/settings",
        label: "Configuraciones",
        icon: <SettingsIcon />,
      },
    ];

    if (session?.user.role === "admin") {
      baseLinks.splice(-1, 0, {
        href: "/admin",
        label: "Administrador",
        icon: <UserRoundCogIcon />,
      });
      baseLinks.splice(-1, 0, {
        href: "/organizations",
        label: "Organizaciones",
        icon: <Building2Icon />,
      });
    }

    if (session?.user.role === "user") {
      baseLinks.splice(-1, 0, {
        href: `/${session.user.username}`,
        label: "Perfil",
        icon: <UserRoundIcon />,
      });
    }

    return baseLinks;
  }, [session?.user.username, session?.user.role]);

  return {
    links,
    session,
    isSessionSuccess,
    isSessionLoading,
    isSessionError,
    refetchSession,
    isSessionRefetching,
  };
};
