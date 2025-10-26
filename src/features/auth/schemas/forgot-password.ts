import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.email({
    message: "El correo electrónico debe ser una dirección de correo válida",
  }),
});
