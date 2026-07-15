import { useQuery } from "@tanstack/react-query";

import { getMyProducts } from "@/features/seller/actions/get-my-products";

export const useMyProducts = () => {
  return useQuery({
    queryKey: ["seller", "products"],
    queryFn: async () => {
      const result = await getMyProducts();

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data ?? [];
    },
  });
};
