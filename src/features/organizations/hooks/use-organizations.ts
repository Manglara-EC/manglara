import { useQuery } from "@tanstack/react-query";

import { getOrganizations } from "@/features/organizations/actions/get-organizations";

export const useOrganizations = () => {
  return useQuery({
    queryKey: ["organization", "list"],
    queryFn: async () => {
      const { data, error } = await getOrganizations();

      if (error) throw new Error(error.message);

      return data;
    },
  });
};
