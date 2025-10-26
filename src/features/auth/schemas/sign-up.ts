import { z } from "zod";

export const signUpSchema = z.object({
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
  password: z
    .string()
    .min(8, {
      message: "La contraseña debe tener al menos 8 caracteres",
    })
    .max(50, {
      message: "La contraseña debe tener menos de 50 caracteres",
    })
    .regex(/[0-9]/, {
      message: "La contraseña debe contener al menos un número",
    })
    .regex(/[a-z]/, {
      message: "La contraseña debe contener al menos una letra minúscula",
    })
    .regex(/[A-Z]/, {
      message: "La contraseña debe contener al menos una letra mayúscula",
    })
    .regex(/[^\w\s]/, {
      message: "La contraseña debe contener al menos un carácter especial",
    }),
});
