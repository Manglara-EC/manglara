"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { useSession } from "@/shared/hooks/use-session";
import { buildAuthURL } from "@/shared/utils/redirect";

/**
 * Auth-wall para acciones interactivas (reservar, comprar, carrito...).
 *
 * `requireAuth()` devuelve `true` si el usuario tiene sesión. Si es invitado,
 * lo envía a `/sign-in?redirect=<url actual>` y devuelve `false`.
 *
 * @example
 * const { requireAuth } = useAuthGuard();
 * const handleBook = () => {
 *   if (!requireAuth()) return;
 *   ...
 * };
 */
export const useAuthGuard = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isSuccess } = useSession();

  // Mientras la sesión carga no se asume invitado; el backend valida igual.
  const isGuest = isSuccess && !session;

  const requireAuth = useCallback(
    (message = "Inicia sesión para continuar") => {
      if (!isGuest) return true;

      toast.info(message, {
        description: "Te traeremos de vuelta aquí después de iniciar sesión.",
      });

      router.push(buildAuthURL("/sign-in", pathname + window.location.search));
      return false;
    },
    [isGuest, pathname, router],
  );

  return { isGuest, requireAuth };
};
