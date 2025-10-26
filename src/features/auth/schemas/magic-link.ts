import { z } from "zod";

export const magicLinkSchema = z.object({
  email: z.email({
    message: "El correo electrónico debe ser una dirección de correo válida",
  }),
});
