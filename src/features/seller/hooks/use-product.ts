"use client";

import { useQuery } from "@tanstack/react-query";
import { getProductById } from "@/features/seller/actions/get-product-by-id";

export const useProduct = (productId: string) => {
  return useQuery({
    queryKey: ["seller", "product", productId],
    queryFn: async () => {
      const result = await getProductById(productId);
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      return result.data;
    },
    enabled: !!productId,
  });
};
