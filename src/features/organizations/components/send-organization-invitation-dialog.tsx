"use client";

import { useTranslation } from "react-i18next";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";

import { SendOrganizationInvitationForm } from "@/features/organizations/components/send-organization-invitation-form";

interface Props {
  dialogTriggerRef: React.RefObject<HTMLButtonElement | null>;
  organizationId: string;
}

export function SendOrganizationInvitationDialog({
  dialogTriggerRef,
  organizationId,
}: Props) {
  const { t: tOrganization } = useTranslation("organization");

  return (
    <Dialog>
      <DialogTrigger ref={dialogTriggerRef} />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {tOrganization("sendOrganizationInvitationDialog.title")}
          </DialogTitle>

          <DialogDescription>
            {tOrganization("sendOrganizationInvitationDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <SendOrganizationInvitationForm organizationId={organizationId} />
      </DialogContent>
    </Dialog>
  );
}
