"use client";

import { useTranslation } from "react-i18next";

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
  const { t: tOrganization } = useTranslation("organization");

  const { total, handleSendInvitation, dialogTriggerRef } =
    useOrganizationInvitations({
      organizationId,
    });

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-center justify-between">
        <TypographyH4>
          {tOrganization("organizationInvitations.text.invitations", {
            count: total,
          })}
        </TypographyH4>

        <Button onClick={handleSendInvitation}>
          <PlusIcon className="size-4" />
          {tOrganization("organizationInvitations.actions.inviteMember")}
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
