import { z } from "zod";

export const rejectProductSchema = z.object({
  productId: z.string().min(1, { message: "Product ID is required" }),
  reason: z
    .string()
    .trim()
    .max(500, { message: "Reason must be less than 500 characters" })
    .optional(),
});
