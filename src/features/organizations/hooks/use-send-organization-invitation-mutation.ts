import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Invitation } from "better-auth/plugins/organization";
import { UseFormReturn } from "react-hook-form";

import { authClient } from "@/shared/lib/better-auth/client";
import { RATE_LIMIT_ERROR_CODE } from "@/shared/constants";
import type { AuthClientError } from "@/shared/types";

import type { SendOrganizationInvitationVariables } from "@/features/organizations/types";

interface Props {
  form: UseFormReturn<SendOrganizationInvitationVariables>;
  dialogCloseRef: React.RefObject<HTMLButtonElement | null>;
  organizationId: string;
}

export const useSendOrganizationInvitationMutation = ({
  form,
  dialogCloseRef,
  organizationId,
}: Props) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: SendOrganizationInvitationVariables) => {
      const { data, error } = await authClient.organization.inviteMember({
        organizationId,
        email: variables.email,
        resend: true,
        role: "member",
      });

      if (error) return Promise.reject(error);

      return data;
    },
    onSuccess: (data) => {
      toast.success("Invitación enviada exitosamente 🎉");
      dialogCloseRef.current?.click();

      queryClient.setQueryData(
        ["organization", organizationId, "invitation", "list"],
        (old: Invitation[]) => {
          const existingInvitationIndex = old.findIndex(
            (invitation) => invitation.email === data.email,
          );

          if (existingInvitationIndex !== -1) {
            old[existingInvitationIndex] = data;

            return old;
          }

          return [...old, data];
        },
      );

      queryClient.setQueryData(
        ["organization", organizationId, "invitation", "total"],
        (old: number) => old + 1,
      );
    },
    onError: (error: AuthClientError) => {
      if (error.status === RATE_LIMIT_ERROR_CODE) return;

      switch (error.code) {
        case "USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION":
          form.setError("email", {
            message: "El usuario ya es miembro de esta organización",
          });
          return;

        default:
          toast.error("No se pudo enviar la invitación 😢", {
            description: "Por favor, inténtelo de nuevo más tarde.",
          });
          return;
      }
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
