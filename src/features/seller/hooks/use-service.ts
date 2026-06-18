"use client";

import { useQuery } from "@tanstack/react-query";
import { getServiceById } from "@/features/seller/actions/get-service-by-id";

export const useService = (serviceId: string) => {
  return useQuery({
    queryKey: ["seller", "service", serviceId],
    queryFn: async () => {
      const result = await getServiceById(serviceId);

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data!;
    },
    enabled: !!serviceId,
  });
};
