import type { Invitation } from "better-auth/plugins";

import { useCancelInvitationMutation } from "@/features/organizations/hooks/use-cancel-invitation-mutation";

interface Props {
  invitation: Invitation;
}

export const useInvitationsTableRowActions = ({ invitation }: Props) => {
  const { mutate: cancelInvitation, isPending: isCancelInvitationPending } =
    useCancelInvitationMutation({
      organizationId: invitation.organizationId,
    });

  const handleCancelInvitation = (event: Event) => {
    event.preventDefault();

    cancelInvitation({
      invitationId: invitation.id,
    });
  };

  return {
    isCancelInvitationPending,
    handleCancelInvitation,
  };
};
