import { z } from "zod";

export const credentialsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, {
      message: "El nombre de usuario debe tener al menos 3 caracteres",
    })
    .max(30, {
      message: "El nombre de usuario debe tener menos de 30 caracteres",
    })
    .regex(/^\w+$/, {
      message:
        "El nombre de usuario debe contener solo caracteres alfanuméricos y guiones bajos",
    }),
  password: z
    .string()
    .min(8, {
      message: "La contraseña debe tener al menos 8 caracteres",
    })
    .max(50, {
      message: "La contraseña debe tener menos de 50 caracteres",
    }),
});
