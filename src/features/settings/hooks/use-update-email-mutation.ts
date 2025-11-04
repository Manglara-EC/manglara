import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import { RATE_LIMIT_ERROR_CODE } from "@/shared/constants";
import { authClient } from "@/shared/lib/better-auth/client";
import type { AuthClientError } from "@/shared/types";

import type { UpdateEmailVariables } from "@/features/settings/types";

interface Props {
  form: UseFormReturn<UpdateEmailVariables>;
}

export const useUpdateEmailMutation = ({ form }: Props) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: UpdateEmailVariables) => {
      const { error } = await authClient.changeEmail({
        newEmail: variables.email,
        callbackURL: "/settings/account",
      });

      if (error) return Promise.reject(error);
    },
    onSuccess: (_data, variables) => {
      toast.success("Verificación de cambio de correo 💂", {
        description:
          "Hemos enviado una confirmación a tu dirección de correo electrónico antigua. Por favor, revisa tu bandeja de entrada (o carpeta de spam) para aprobar los cambios y actualizarla.",
        duration: 20_000,
      });

      form.reset({ email: variables.email });
    },
    onError: (error: AuthClientError) => {
      if (error.status === RATE_LIMIT_ERROR_CODE) return;

      switch (error.code) {
        case "COULDNT_UPDATE_YOUR_EMAIL":
          form.setError("email", {
            message: "Un usuario con ese correo electrónico ya existe",
          });
          return;

        default:
          toast.error("Algo salió mal 😢", {
            description: "Por favor, inténtalo de nuevo más tarde.",
            duration: 10_000,
          });
          return;
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["session", "detail"] });
    },
  });
};
