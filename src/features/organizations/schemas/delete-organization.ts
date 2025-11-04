import { z } from "zod";

export const deleteOrganizationSchema = z.object({
  organizationId: z
    .string()
    .min(1, { message: "El ID de la organización es requerido" }),
});
