import { useDeleteOrganizationMutation } from "@/features/organizations/hooks/use-delete-organization-mutation";

interface Props {
  organizationId: string;
}

export const useDeleteOrganizationButton = ({ organizationId }: Props) => {
  const { mutate, isPending } = useDeleteOrganizationMutation();

  const handleDeleteOrganization = () =>
    mutate({
      organizationId: organizationId,
    });

  return { isPending, handleDeleteOrganization };
};
