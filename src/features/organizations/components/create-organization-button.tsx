"use client";

import { Button } from "@/shared/components/ui/button";

import { useCreateOrganizationButton } from "@/features/organizations/hooks/use-create-organization-button";
import { CreateOrganizationDialog } from "@/features/organizations/components/create-organization-dialog";

export function CreateOrganizationButton() {
  const { dialogTriggerRef, handleCreateOrganization } =
    useCreateOrganizationButton();

  return (
    <div>
      <Button onClick={handleCreateOrganization}>Crear organización</Button>

      <CreateOrganizationDialog dialogTriggerRef={dialogTriggerRef} />
    </div>
  );
}
