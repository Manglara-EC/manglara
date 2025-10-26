import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Invitation } from "better-auth/plugins";

import { authClient } from "@/shared/lib/better-auth/client";

import type { CancelInvitationVariables } from "@/features/organizations/types";

interface Props {
  organizationId: string;
}

export const useCancelInvitationMutation = ({ organizationId }: Props) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: CancelInvitationVariables) => {
      const { data, error } = await authClient.organization.cancelInvitation({
        invitationId: variables.invitationId,
      });

      if (error) return Promise.reject(error);

      return data;
    },
    onError: () => {
      toast.error("No se pudo cancelar la invitación 😢", {
        description: "Por favor, inténtelo de nuevo más tarde.",
      });
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        ["organization", organizationId, "invitation", "list"],
        (old: Invitation[]) =>
          old.map((invitation) =>
            invitation.id === variables.invitationId ? data : invitation,
          ),
      );

      toast.success("Invitación cancelada exitosamente 🎉");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["organization", organizationId, "invitation", "list"],
      });
      queryClient.invalidateQueries({
        queryKey: ["organization", organizationId, "invitation", "total"],
      });
    },
  });
};
