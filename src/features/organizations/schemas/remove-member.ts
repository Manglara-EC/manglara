import { z } from "zod";

export const removeMemberSchema = z.object({
  memberId: z.string().min(1, { message: "El ID del usuario es requerido" }),
});
