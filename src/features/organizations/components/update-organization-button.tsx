"use client";

import { PencilIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";

import { useUpdateOrganizationButton } from "@/features/organizations/hooks/use-update-organization-button";
import { UpdateOrganizationDialog } from "@/features/organizations/components/update-organization-dialog";
import type { Organization } from "@/features/organizations/types";

interface Props {
  organization: Organization;
}

export const UpdateOrganizationButton = ({ organization }: Props) => {
  const { dialogTriggerRef, handleUpdateOrganization } =
    useUpdateOrganizationButton();

  return (
    <div>
      <Button onClick={handleUpdateOrganization} variant="outline" size="icon">
        <PencilIcon />
      </Button>

      <UpdateOrganizationDialog
        dialogTriggerRef={dialogTriggerRef}
        organization={organization}
      />
    </div>
  );
};
