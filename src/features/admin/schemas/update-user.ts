import { z } from "zod";

export const updateUserSchema = z.object({
  userId: z.string().min(1, { message: "User ID is required" }),
  name: z
    .string()
    .trim()
    .min(2, {
      message: "El nombre debe tener al menos 2 caracteres",
    })
    .max(50, {
      message: "El nombre debe tener menos de 50 caracteres",
    }),
  username: z
    .string()
    .trim()
    .min(3, {
      message: "El nombre de usuario debe tener al menos 3 caracteres",
    })
    .max(30, {
      message: "El nombre de usuario debe tener menos de 30 caracteres",
    })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message:
        "El nombre de usuario debe contener solo caracteres alfanuméricos y guiones bajos",
    }),
  email: z.email({
    message: "El correo electrónico debe ser una dirección de correo válida",
  }),
  role: z.enum(["admin", "user"]),
});
