import { z } from "zod";

export const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, { message: "El nombre debe tener al menos 3 caracteres" })
    .max(200, { message: "El nombre debe tener menos de 200 caracteres" }),

  description: z
    .string()
    .trim()
    .max(1000, {
      message: "La descripción debe tener menos de 1000 caracteres",
    })
    .optional(),

  price: z
    .string()
    .regex(/^\d+\.?\d{0,2}$/, {
      message: "El precio debe ser un número válido",
    })
    .refine((val) => parseFloat(val) > 0, {
      message: "El precio debe ser mayor a 0",
    }),

  stock: z.coerce
    .number()
    .int()
    .min(0, { message: "El stock no puede ser negativo" })
    .refine((val) => Number.isFinite(val), {
      message: "El stock debe ser un número",
    }),

  images: z.array(z.url()).optional(),
  sellerId: z.string().optional(),
  organizationId: z
    .string()
    .min(1, { message: "Organization ID es requerido" }),
});
