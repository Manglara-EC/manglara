"use client";

import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/ui/button";

import { useCreateOrganizationButton } from "@/features/organizations/hooks/use-create-organization-button";
import { CreateOrganizationDialog } from "@/features/organizations/components/create-organization-dialog";

export function CreateOrganizationButton() {
  const { t: tOrganization } = useTranslation("organization");

  const { dialogTriggerRef, handleCreateOrganization } =
    useCreateOrganizationButton();

  return (
    <div>
      <Button onClick={handleCreateOrganization}>
        {tOrganization("createOrganizationButton.actions.createOrganization")}
      </Button>

      <CreateOrganizationDialog dialogTriggerRef={dialogTriggerRef} />
    </div>
  );
}
