import { z } from "zod";

export const cancelInvitationSchema = z.object({
  invitationId: z
    .string()
    .min(1, { message: "El ID de la invitación es requerido" }),
});
