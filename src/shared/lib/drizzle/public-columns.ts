import { sql } from "drizzle-orm";

/**
 * Columnas de moderación que no deben salir en respuestas públicas
 * (catálogo, fichas, búsquedas): se devuelven como `null`.
 * Uso: `select({ ...getTableColumns(product), ...HIDDEN_MODERATION_COLUMNS })`.
 */
export const HIDDEN_MODERATION_COLUMNS = {
  approvedBy: sql<string | null>`null`,
  approvedAt: sql<Date | null>`null`,
  rejectionReason: sql<string | null>`null`,
};
