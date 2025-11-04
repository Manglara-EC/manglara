import { useRef } from "react";

export const useCreateOrganizationButton = () => {
  const dialogTriggerRef = useRef<HTMLButtonElement>(null);

  const handleCreateOrganization = () => dialogTriggerRef.current?.click();

  return {
    dialogTriggerRef,
    handleCreateOrganization,
  };
};
