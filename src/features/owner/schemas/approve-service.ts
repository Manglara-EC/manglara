import { z } from "zod";

export const approveServiceSchema = z.object({
  serviceId: z.string().min(1, { message: "Service ID is required" }),
});
