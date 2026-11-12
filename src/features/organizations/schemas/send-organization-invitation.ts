import { z } from "zod";

import { OrganizationRole } from "@/shared/constants/roles";

export const sendOrganizationInvitationSchema = z.object({
  email: z.email({
    message: "El correo electrónico debe ser una dirección de correo válida",
  }),
  role: z.enum(OrganizationRole, {
    message: "Selecciona el rol con el que se unirá",
  }),
});
