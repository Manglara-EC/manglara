"use client";

import { useQuery } from "@tanstack/react-query";

import { getMyAccess } from "@/shared/actions/get-my-access";
import { ACCESS_QUERY_KEY } from "@/shared/lib/authz/access";

/**
 * Permisos del usuario actual (rol global + roles por comuna).
 * Se precarga en el layout; usarlo solo para decidir qué mostrar.
 */
export const useAccess = () =>
  useQuery({
    queryKey: ACCESS_QUERY_KEY,
    queryFn: () => getMyAccess(),
  });
