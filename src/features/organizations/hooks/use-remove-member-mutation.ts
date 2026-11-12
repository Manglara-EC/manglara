import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { removeOrganizationMember } from "@/features/organizations/actions/manage-members";
import type { RemoveMemberVariables } from "@/features/organizations/types";

interface Props {
  organizationId: string;
}

export const useRemoveMemberMutation = ({ organizationId }: Props) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: RemoveMemberVariables) => {
      const { data, error } = await removeOrganizationMember({
        organizationId,
        memberId: variables.memberId,
      });

      if (error) return Promise.reject(error);

      return data;
    },
    onError: (error: { message?: string }) => {
      toast.error("No se pudo quitar al miembro", {
        description:
          error.message ?? "Por favor, inténtelo de nuevo más tarde.",
      });
    },
    onSuccess: () => {
      toast.success("Miembro quitado de la comuna");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["organization", organizationId, "member"],
      });
    },
  });
};
