import { useState } from "react";

import { useDeleteOrganizationMutation } from "@/features/organizations/hooks/use-delete-organization-mutation";

interface Props {
  organizationId: string;
  organizationName: string;
}

export const useDeleteOrganizationButton = ({
  organizationId,
  organizationName,
}: Props) => {
  const { mutate, isPending } = useDeleteOrganizationMutation();
  const [confirmationName, setConfirmationName] = useState("");

  const canConfirm = confirmationName.trim() === organizationName.trim();

  const handleDeleteOrganization = () => {
    if (!canConfirm) return;

    mutate({ organizationId, confirmationName });
  };

  return {
    isPending,
    confirmationName,
    setConfirmationName,
    canConfirm,
    handleDeleteOrganization,
  };
};
