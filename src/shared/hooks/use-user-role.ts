"use client";

/**
 * Hook para detección confiable de roles de usuario
 * Maneja:
 * - Carga inicial
 * - Refrescos de página
 * - Cambios de autenticación
 * - Evita flickering
 */

import { useEffect, useState } from "react";
import { useSession } from "@/shared/hooks/use-session";
import { normalizeRole, type UserRole } from "@/shared/constants/roles";

interface UseUserRoleReturn {
  /** Rol del usuario actual (null si no autenticado) */
  role: UserRole | null;
  /** Si los datos de role están cargados */
  isLoading: boolean;
  /** Si hay error al obtener el rol */
  isError: boolean;
  /** Rol raw del servidor (para debugging) */
  rawRole?: string;
}

/**
 * Hook para obtener y detectar el rol del usuario de forma confiable
 *
 * Características:
 * ✅ Detecta el rol del payload de sesión
 * ✅ Normaliza inconsistencias de caso (SELLER → seller)
 * ✅ Maneja hydration en SSR
 * ✅ Evita flickering con isLoading
 * ✅ Type-safe con normalizeRole
 *
 * @example
 * const { role, isLoading } = useUserRole();
 *
 * if (isLoading) return <Skeleton />;
 * if (role === "seller") return <SellerMenu />;
 *
 * @returns {UseUserRoleReturn} Objeto con role, isLoading, isError
 */
export const useUserRole = (): UseUserRoleReturn => {
  const { data: session, isPending: isSessionLoading } = useSession();
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rawRole, setRawRole] = useState<string>();

  useEffect(() => {
    // Si la sesión aún se está cargando, no procesar
    if (isSessionLoading) {
      setIsLoading(true);
      return;
    }

    // Si no hay usuario, no hay rol
    if (!session || !session.user) {
      setRole(null);
      setRawRole(undefined);
      setIsLoading(false);
      return;
    }

    // Obtener el rol del usuario
    // Posibles ubicaciones según la configuración de better-auth:
    // 1. session.user.role
    // 2. session.user?.metadata?.role
    // 3. Custom fields si se configuraron
    const rawRoleValue =
      (session.user?.role as string | undefined) ||
      ((session.user as Record<string, unknown>)?.metadata as Record<string, string> | undefined)?.role ||
      undefined;

    setRawRole(rawRoleValue);

    // Normalizar el rol (manejar SELLER, Seller, seller, etc.)
    if (rawRoleValue) {
      const normalizedRole = normalizeRole(rawRoleValue);
      setRole(normalizedRole);

      // Log para debugging
      if (process.env.NODE_ENV === "development") {
        console.debug(`[useUserRole] Raw: "${rawRoleValue}" → Normalized: "${normalizedRole}"`);
      }
    } else {
      // Si no hay rol en la sesión, el usuario no tiene rol asignado
      setRole(null);
      console.warn("[useUserRole] No role found in session.user");
    }

    setIsLoading(false);
  }, [session, isSessionLoading]);

  return {
    role,
    isLoading,
    isError: !isLoading && !session?.user,
    rawRole,
  };
};

/**
 * Hook auxiliar para verificar si el usuario tiene un rol específico
 * Útil para condicionales más claros
 *
 * @example
 * const isSeller = useHasRole("seller");
 * if (isSeller) return <SellerDashboard />;
 */
export const useHasRole = (requiredRole: UserRole): boolean => {
  const { role, isLoading } = useUserRole();
  return !isLoading && role === requiredRole;
};

/**
 * Hook auxiliar para verificar si el usuario tiene uno de varios roles
 *
 * @example
 * const canSell = useHasAnyRole(["seller", "admin"]);
 * if (canSell) return <CreateProductButton />;
 */
export const useHasAnyRole = (requiredRoles: UserRole[]): boolean => {
  const { role, isLoading } = useUserRole();
  return !isLoading && role !== null && requiredRoles.includes(role);
};
