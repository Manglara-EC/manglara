import { UseFormReturn } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { RATE_LIMIT_ERROR_CODE } from "@/shared/constants";
import { authClient } from "@/shared/lib/better-auth/client";
import type { AuthClientError } from "@/shared/types";

import type { MagicLinkVariables } from "@/features/auth/types";

interface Props {
  form: UseFormReturn<MagicLinkVariables>;
}

export const useMagicLinkMutation = ({ form }: Props) => {
  return useMutation({
    mutationFn: async (variables: MagicLinkVariables) => {
      const { error } = await authClient.signIn.magicLink({
        email: variables.email,
        callbackURL: "/home",
      });

      if (error) return Promise.reject(error);
    },
    onSuccess: () => {
      toast.success("Link mágico enviado exitosamente 🎉", {
        description:
          "Revisa tu bandeja de entrada (o carpeta de spam) para el enlace.",
        duration: 10_000,
      });
    },
    onError: (error: AuthClientError) => {
      if (error.status === RATE_LIMIT_ERROR_CODE) return;

      switch (error.code) {
        case "USER_NOT_FOUND":
          form.setError("email", {
            message:
              "Por favor, revisa tu dirección de correo electrónico o regístrate si no tienes una cuenta.",
          });
          return;

        case "FAILED_TO_SEND_MAGIC_LINK":
          toast.error("No se pudo enviar el link mágico 😢", {
            duration: 10_000,
            description:
              "Inténtalo de nuevo más tarde o usa otro método para iniciar sesión.",
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
