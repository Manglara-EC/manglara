import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import { RATE_LIMIT_ERROR_CODE } from "@/shared/constants";
import { authClient } from "@/shared/lib/better-auth/client";
import type { AuthClientError, Session } from "@/shared/types";

import type { UpdateTwoFactorVariables } from "@/features/settings/types";

interface Props {
  form: UseFormReturn<UpdateTwoFactorVariables>;
}

export const useDisable2FAMutation = ({ form }: Props) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      variables: Pick<UpdateTwoFactorVariables, "password">,
    ) => {
      const { error } = await authClient.twoFactor.disable({
        password: variables.password,
      });

      if (error) return Promise.reject(error);
    },
    onSuccess: () => {
      toast.success("2FA deshabilitado exitosamente 🎉", {
        duration: 10_000,
      });

      queryClient.setQueryData(
        ["session", "detail"],
        (old: Session): Session => {
          return {
            session: old.session,
            user: { ...old.user, twoFactorEnabled: false },
          };
        },
      );

      form.reset({ enable2FA: false });
    },
    onError: (error: AuthClientError) => {
      if (error.status === RATE_LIMIT_ERROR_CODE) return;

      switch (error.code) {
        case "INVALID_PASSWORD":
          form.setError("password", {
            message: "Contraseña inválida",
          });
          return;

        default:
          toast.error("No se pudo deshabilitar 2FA 😢", {
            description: "Por favor, inténtalo de nuevo más tarde.",
            duration: 10_000,
          });
          return;
      }
    },
    // We do both in this case because not doing so
    // will cause the session to be out of sync with the sessions queries
    onSettled: () => {
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["session", "detail"] }),
        queryClient.invalidateQueries({ queryKey: ["session", "list"] }),
      ]);
    },
  });
};
