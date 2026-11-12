import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { updateMemberRole } from "@/features/organizations/actions/manage-members";
import {
  ORGANIZATION_ROLE_DISPLAY_NAMES,
  type OrganizationRole,
} from "@/shared/constants/roles";

interface Props {
  organizationId: string;
}

export const useUpdateMemberRoleMutation = ({ organizationId }: Props) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: {
      memberId: string;
      role: OrganizationRole;
    }) => {
      const { data, error } = await updateMemberRole({
        organizationId,
        ...variables,
      });

      if (error) return Promise.reject(error);

      return data;
    },
    onError: (error: { message?: string }) => {
      toast.error("No se pudo cambiar el rol", {
        description:
          error.message ?? "Por favor, inténtelo de nuevo más tarde.",
      });
    },
    onSuccess: (data) => {
      toast.success(
        `Rol actualizado a ${ORGANIZATION_ROLE_DISPLAY_NAMES[data.role]}`,
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["organization", organizationId],
      });
    },
  });
};
