import { z } from "zod";

export const approveProductSchema = z.object({
  productId: z.string().min(1, { message: "Product ID is required" }),
});
