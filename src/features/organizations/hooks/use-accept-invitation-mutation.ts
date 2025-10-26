import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { authClient } from "@/shared/lib/better-auth/client";

import type { AcceptInvitationVariables } from "@/features/organizations/types";

export const useAcceptInvitationMutation = () => {
  const queryClient = useQueryClient();

  const router = useRouter();

  return useMutation({
    mutationFn: async (variables: AcceptInvitationVariables) => {
      const { data, error } = await authClient.organization.acceptInvitation({
        invitationId: variables.invitationId,
      });

      if (error) return Promise.reject(error);

      return data;
    },
    onSuccess: () => {
      toast.success("Invitación aceptada exitosamente 🎉");

      router.push("/home");
    },
    onError: () => {
      toast.error("No se pudo aceptar la invitación 😢", {
        description: "Por favor, inténtelo de nuevo más tarde.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["organization"],
      });
    },
  });
};
