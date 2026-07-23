import { useQuery } from "@tanstack/react-query";

import { getMyServices } from "@/features/seller/actions/get-my-services";

export const useMyServices = () => {
  return useQuery({
    queryKey: ["seller", "services"],
    queryFn: async () => {
      const result = await getMyServices();

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data ?? [];
    },
  });
};
