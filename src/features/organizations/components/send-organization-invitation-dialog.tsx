"use client";

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
  return (
    <Dialog>
      <DialogTrigger ref={dialogTriggerRef} />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar invitación</DialogTitle>

          <DialogDescription>
            Envía una invitación a un usuario de Manglara para que se una a la
            organización.
          </DialogDescription>
        </DialogHeader>

        <SendOrganizationInvitationForm organizationId={organizationId} />
      </DialogContent>
    </Dialog>
  );
}
