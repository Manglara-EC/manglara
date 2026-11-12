import { z } from "zod";

export const itemRefSchema = z.object({
  itemId: z
    .string({ message: "El ID del ítem es requerido" })
    .min(1, { message: "El ID del ítem es requerido" }),
  itemType: z.enum(["product", "service"], {
    message: "Tipo de ítem inválido",
  }),
});

/**
 * Aprobar/rechazar: `expectedUpdatedAt` es la versión que vio el moderador.
 * Si el vendedor editó el ítem después, la decisión se rechaza.
 */
export const moderateItemSchema = itemRefSchema.extend({
  expectedUpdatedAt: z.coerce.date().optional(),
});

export const rejectItemSchema = moderateItemSchema.extend({
  reason: z
    .string({ message: "Debes proporcionar una razón para el rechazo" })
    .trim()
    .min(1, { message: "Debes proporcionar una razón para el rechazo" })
    .max(500, { message: "La razón debe tener menos de 500 caracteres" }),
});

export type ItemRef = z.infer<typeof itemRefSchema>;
export type ModerateItemInput = z.input<typeof moderateItemSchema>;
export type RejectItemInput = z.input<typeof rejectItemSchema>;

export interface OrganizationStats {
  totalProducts: number;
  pendingProducts: number;
  approvedProducts: number;
  rejectedProducts: number;
  totalServices: number;
  pendingServices: number;
  approvedServices: number;
  rejectedServices: number;
}
