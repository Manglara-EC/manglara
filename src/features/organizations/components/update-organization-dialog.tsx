"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";

import { UpdateOrganizationForm } from "@/features/organizations/components/update-organization-form";
import type { Organization } from "@/features/organizations/types";

interface Props {
  dialogTriggerRef: React.RefObject<HTMLButtonElement | null>;
  organization: Organization;
}

export function UpdateOrganizationDialog({
  dialogTriggerRef,
  organization,
}: Props) {
  return (
    <Dialog>
      <DialogTrigger ref={dialogTriggerRef} />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Actualizar organización</DialogTitle>

          <DialogDescription>
            Actualiza la información de la organización.
          </DialogDescription>
        </DialogHeader>

        <UpdateOrganizationForm organization={organization} />
      </DialogContent>
    </Dialog>
  );
}
