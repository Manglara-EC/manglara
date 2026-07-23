import { z } from "zod";

export const markAsReadSchema = z.object({
  requestId: z.string().min(1, { message: "Request ID is required" }),
});
