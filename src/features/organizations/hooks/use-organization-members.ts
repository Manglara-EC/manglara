import { useQuery } from "@tanstack/react-query";

import { authClient } from "@/shared/lib/better-auth/client";

interface Props {
  organizationId: string;
}

export const useOrganizationMembers = ({ organizationId }: Props) => {
  const { data } = useQuery({
    queryKey: ["organization", organizationId, "member", "total"],
    queryFn: async () => {
      const { data, error } = await authClient.organization.listMembers({
        query: {
          organizationId,
          limit: 0,
          offset: 0,
        },
      });

      if (error) return Promise.reject(error);

      return data.total;
    },
  });

  return {
    total: data || 0,
  };
};
