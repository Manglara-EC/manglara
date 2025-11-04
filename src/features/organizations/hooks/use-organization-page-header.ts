import { useQuery } from "@tanstack/react-query";

import { authClient } from "@/shared/lib/better-auth/client";

interface Props {
  organizationId: string;
}

export const useOrganizationPageHeader = ({ organizationId }: Props) => {
  const { data, isLoading, isError, isRefetching, refetch } = useQuery({
    queryKey: ["organization", organizationId, "detail"],
    queryFn: async () => {
      const { data, error } = await authClient.organization.getFullOrganization(
        {
          query: { organizationId, membersLimit: 0 },
        },
      );

      if (error) return Promise.reject(error);

      return data;
    },
  });

  return {
    data,
    isLoading,
    isError,
    isRefetching,
    refetch,
  };
};
