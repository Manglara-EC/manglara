import { z } from "zod";

export const paginationParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
});

export const paginationResponseSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

export type PaginationParams = z.infer<typeof paginationParamsSchema>;
export type PaginationResponse = z.infer<typeof paginationResponseSchema>;

/**
 * Calcula los parámetros de paginación para el offset
 * @param page - Número de página (comienza en 1)
 * @param pageSize - Cantidad de elementos por página
 * @returns offset para usar en la base de datos
 */
export const calculateOffset = (page: number, pageSize: number): number => {
  return (page - 1) * pageSize;
};

/**
 * Calcula la información de paginación completa
 * @param page - Número de página actual
 * @param pageSize - Cantidad de elementos por página
 * @param total - Total de elementos disponibles
 * @returns Información completa de paginación
 */
export const calculatePagination = (
  page: number,
  pageSize: number,
  total: number,
): PaginationResponse => {
  const totalPages = Math.ceil(total / pageSize);

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};
