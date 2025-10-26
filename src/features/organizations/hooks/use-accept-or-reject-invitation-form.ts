import { useQuery } from "@tanstack/react-query";

import { authClient } from "@/shared/lib/better-auth/client";

import { useAcceptInvitationMutation } from "@/features/organizations/hooks/use-accept-invitation-mutation";
import { useRejectInvitationMutation } from "@/features/organizations/hooks/use-reject-invitation-mutation";

interface Props {
  invitationId: string;
}

export const useAcceptOrRejectInvitationForm = ({ invitationId }: Props) => {
  const { data, isSuccess, isLoading, isError, isRefetching, refetch } =
    useQuery({
      enabled: !!invitationId,
      queryKey: ["invitation", invitationId],
      queryFn: async () => {
        const { data, error } = await authClient.organization.getInvitation({
          query: {
            id: invitationId,
          },
        });

        if (error) return Promise.reject(error);

        return data;
      },
    });

  const { mutate: acceptInvitation, isPending: isAcceptInvitationPending } =
    useAcceptInvitationMutation();

  const { mutate: rejectInvitation, isPending: isRejectInvitationPending } =
    useRejectInvitationMutation();

  const handleAcceptInvitation = () =>
    acceptInvitation({
      invitationId,
    });

  const handleRejectInvitation = () =>
    rejectInvitation({
      invitationId,
    });

  return {
    data,
    isSuccess,
    isLoading,
    isError,
    isRefetching,
    refetch,
    handleAcceptInvitation,
    handleRejectInvitation,
    isAcceptInvitationPending,
    isRejectInvitationPending,
  };
};
