import { z } from "zod";

export const resetPasswordSchema = z
  .object({
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
    confirmPassword: z
      .string()
      .min(8, {
        message: "La contraseña debe tener al menos 8 caracteres",
      })
      .max(50, {
        message: "La contraseña debe tener menos de 50 caracteres",
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });
