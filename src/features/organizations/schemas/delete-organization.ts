import { z } from "zod";

export const deleteOrganizationSchema = z.object({
  organizationId: z
    .string()
    .min(1, { message: "El ID de la organización es requerido" }),
  confirmationName: z
    .string()
    .trim()
    .min(1, { message: "Escribe el nombre de la comuna para confirmar" }),
});
