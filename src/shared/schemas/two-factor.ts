import { z } from "zod";

export const twoFactorSchema = z.object({
  code: z.string().min(6, {
    message: "El código de verificación debe tener 6 caracteres",
  }),
});
