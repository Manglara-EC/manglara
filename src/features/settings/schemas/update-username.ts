import { z } from "zod";

export const updateUsernameSchema = z.object({
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
});
