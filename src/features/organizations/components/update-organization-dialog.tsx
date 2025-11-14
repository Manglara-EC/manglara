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
  const { t: tOrganization } = useTranslation("organization");

  return (
    <Dialog>
      <DialogTrigger ref={dialogTriggerRef} />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {tOrganization("updateOrganizationDialog.title")}
          </DialogTitle>

          <DialogDescription>
            {tOrganization("updateOrganizationDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <UpdateOrganizationForm organization={organization} />
      </DialogContent>
    </Dialog>
  );
}
