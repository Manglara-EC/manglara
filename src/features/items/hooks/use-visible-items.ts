import { useQuery } from "@tanstack/react-query";

import { getVisibleItems } from "@/features/items/actions/get-visible-items";
import type { ItemSearchParams } from "@/features/items/types";

interface Props {
  params?: ItemSearchParams;
}

export const useVisibleItems = ({ params }: Props = {}) => {
  return useQuery({
    queryKey: ["items", "visible", params],
    queryFn: async () => {
      const { data, error } = await getVisibleItems(params);

      if (error) throw new Error(error.message);

      return data;
    },
  });
};

