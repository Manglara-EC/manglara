"use client";

import { PlusIcon } from "lucide-react";

import { TypographyH4 } from "@/shared/components/ui/typography";

import { Button } from "@/shared/components/ui/button";

import { InvitationsTable } from "@/features/organizations/components/invitations-table";
import { SendOrganizationInvitationDialog } from "@/features/organizations/components/send-organization-invitation-dialog";
import { useOrganizationInvitations } from "@/features/organizations/hooks/use-organization-invitations";

interface Props {
  organizationId: string;
}

export const OrganizationInvitations = ({ organizationId }: Props) => {
  const { total, handleSendInvitation, dialogTriggerRef } =
    useOrganizationInvitations({
      organizationId,
    });

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-center justify-between">
        <TypographyH4>Invitaciones ({total})</TypographyH4>

        <Button onClick={handleSendInvitation}>
          <PlusIcon className="size-4" />
          Invitar miembro
        </Button>
      </div>

      <InvitationsTable organizationId={organizationId} />

      <SendOrganizationInvitationDialog
        dialogTriggerRef={dialogTriggerRef}
        organizationId={organizationId}
      />
    </div>
  );
};
