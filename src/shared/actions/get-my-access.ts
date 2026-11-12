"use server";

import { getAccess } from "@/shared/lib/authz/server";
import type { Access } from "@/shared/lib/authz/access";

/**
 * Permisos del usuario actual para pintar la interfaz (menú, botones).
 * Solo informa: cada acción vuelve a validar en el servidor.
 */
export const getMyAccess = async (): Promise<Access> => getAccess();
