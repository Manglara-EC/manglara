import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { authClient } from "@/shared/lib/better-auth/client";

import type { RejectInvitationVariables } from "@/features/organizations/types";

export const useRejectInvitationMutation = () => {
  const queryClient = useQueryClient();

  const router = useRouter();

  return useMutation({
    mutationFn: async (variables: RejectInvitationVariables) => {
      const { data, error } = await authClient.organization.rejectInvitation({
        invitationId: variables.invitationId,
      });

      if (error) return Promise.reject(error);

      return data;
    },
    onSuccess: () => {
      toast.success("Invitación rechazada exitosamente 🎉");

      router.push("/home");
    },
    onError: () => {
      toast.error("No se pudo rechazar la invitación 😢", {
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
