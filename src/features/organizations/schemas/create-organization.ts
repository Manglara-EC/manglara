import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().min(1, { message: "El nombre es requerido" }),
  slug: z.string().min(1, { message: "El slug es requerido" }),
});
