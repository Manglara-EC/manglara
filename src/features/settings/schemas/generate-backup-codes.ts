import { z } from "zod";

export const generateBackupCodesSchema = z.object({
  generateBackupCodes: z.boolean(),
  password: z
    .string()
    .min(8, {
      message: "La contraseña debe tener al menos 8 caracteres",
    })
    .max(50, {
      message: "La contraseña debe tener menos de 50 caracteres",
    }),
});
