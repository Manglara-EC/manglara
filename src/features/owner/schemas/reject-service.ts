import { z } from "zod";

export const rejectServiceSchema = z.object({
  serviceId: z.string().min(1, { message: "Service ID is required" }),
  reason: z
    .string()
    .trim()
    .max(500, { message: "Reason must be less than 500 characters" })
    .optional(),
});
