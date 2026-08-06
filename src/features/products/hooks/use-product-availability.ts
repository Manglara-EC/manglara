import { useQuery } from "@tanstack/react-query";

import { getProductAvailability } from "../actions/get-product-availability";

export const useProductAvailability = (productId: string, date: string | null) => {
  return useQuery({
    queryKey: ["product", "availability", productId, date],
    queryFn: async () => {
      if (!date) return null;

      const result = await getProductAvailability(productId, date);

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    enabled: Boolean(productId) && Boolean(date),
  });
};
