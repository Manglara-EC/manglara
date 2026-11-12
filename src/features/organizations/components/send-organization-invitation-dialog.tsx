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
import type { OrganizationRole } from "@/shared/constants/roles";

interface Props {
  dialogTriggerRef: React.RefObject<HTMLButtonElement | null>;
  organizationId: string;
  assignableRoles: readonly OrganizationRole[];
}

export function SendOrganizationInvitationDialog({
  dialogTriggerRef,
  organizationId,
  assignableRoles,
}: Props) {
  return (
    <Dialog>
      <DialogTrigger ref={dialogTriggerRef} />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar invitación</DialogTitle>

          <DialogDescription>
            Invita a una cuenta de Manglara a unirse a la comuna con el rol que
            elijas. Verá la invitación en la sección Comunas.
          </DialogDescription>
        </DialogHeader>

        <SendOrganizationInvitationForm
          organizationId={organizationId}
          assignableRoles={assignableRoles}
        />
      </DialogContent>
    </Dialog>
  );
}
