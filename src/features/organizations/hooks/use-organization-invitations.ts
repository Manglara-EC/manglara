import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";

import { authClient } from "@/shared/lib/better-auth/client";

interface Props {
  organizationId: string;
}

export const useOrganizationInvitations = ({ organizationId }: Props) => {
  const dialogTriggerRef = useRef<HTMLButtonElement>(null);

  const { data } = useQuery({
    queryKey: ["organization", organizationId, "invitation", "total"],
    queryFn: async () => {
      const { data, error } = await authClient.organization.listInvitations({
        query: {
          organizationId,
        },
      });

      if (error) return Promise.reject(error);

      return data.length;
    },
  });

  const handleSendInvitation = () => dialogTriggerRef.current?.click();

  return {
    total: data || 0,
    handleSendInvitation,
    dialogTriggerRef,
  };
};
