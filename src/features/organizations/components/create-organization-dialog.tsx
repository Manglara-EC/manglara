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

import { CreateOrganizationForm } from "@/features/organizations/components/create-organization-form";

interface Props {
  dialogTriggerRef: React.RefObject<HTMLButtonElement | null>;
}

export function CreateOrganizationDialog({ dialogTriggerRef }: Props) {
  const { t: tOrganization } = useTranslation("organization");

  return (
    <Dialog>
      <DialogTrigger ref={dialogTriggerRef} />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {tOrganization("createOrganizationDialog.title")}
          </DialogTitle>

          <DialogDescription>
            {tOrganization("createOrganizationDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <CreateOrganizationForm />
      </DialogContent>
    </Dialog>
  );
}
