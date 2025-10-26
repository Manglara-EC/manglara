import { useRef } from "react";

export const useUpdateOrganizationButton = () => {
  const dialogTriggerRef = useRef<HTMLButtonElement>(null);

  const handleUpdateOrganization = () => dialogTriggerRef.current?.click();

  return {
    dialogTriggerRef,
    handleUpdateOrganization,
  };
};
