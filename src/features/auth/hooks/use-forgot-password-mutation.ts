import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { RATE_LIMIT_ERROR_CODE } from "@/shared/constants";
import { authClient } from "@/shared/lib/better-auth/client";
import type { AuthClientError } from "@/shared/types";

import type { ForgotPasswordVariables } from "@/features/auth/types";

export const useForgotPasswordMutation = () => {
  return useMutation({
    mutationFn: async (variables: ForgotPasswordVariables) => {
      const { error } = await authClient.requestPasswordReset({
        email: variables.email,
        redirectTo: "/reset-password",
      });

      if (error) return Promise.reject(error);
    },
    onSuccess: () => {
      toast.success("Link de restablecimiento enviado exitosamente 🎉", {
        description:
          "Revisa tu bandeja de entrada (o carpeta de spam) para el enlace.",
        duration: 10_000,
      });
    },
    onError: (error: AuthClientError) => {
      if (error.status === RATE_LIMIT_ERROR_CODE) return;

      switch (error.code) {
        case "FAILED_TO_SEND_RESET_PASSWORD_EMAIL":
          toast.error("No se pudo enviar el correo de restablecimiento 😢", {
            description: "Por favor, inténtelo de nuevo más tarde.",
            duration: 10_000,
          });
          return;

        default:
          toast.error("Algo salió mal 😢", {
            description: "Por favor, inténtelo de nuevo más tarde.",
            duration: 10_000,
          });
          return;
      }
    },
  });
};
