"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";

import { CreateOrganizationForm } from "@/features/organizations/components/create-organization-form";

interface Props {
  dialogTriggerRef: React.RefObject<HTMLButtonElement | null>;
}

export function CreateOrganizationDialog({ dialogTriggerRef }: Props) {
  return (
    <Dialog>
      <DialogTrigger ref={dialogTriggerRef} />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear organización</DialogTitle>

          <DialogDescription>
            Las organizaciones te permiten agrupar tus colaboradores en un mismo
            lugar.
          </DialogDescription>
        </DialogHeader>

        <CreateOrganizationForm />
      </DialogContent>
    </Dialog>
  );
}
