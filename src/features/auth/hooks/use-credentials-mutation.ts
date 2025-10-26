import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import { RATE_LIMIT_ERROR_CODE } from "@/shared/constants";
import { authClient } from "@/shared/lib/better-auth/client";
import type { AuthClientError } from "@/shared/types";

import type { CredentialsVariables } from "@/features/auth/types";

interface Props {
  form: UseFormReturn<CredentialsVariables>;
}

export const useCredentialsMutation = ({ form }: Props) => {
  const router = useRouter();

  return useMutation({
    mutationFn: async (variables: CredentialsVariables) => {
      const { error } = await authClient.signIn.username(
        {
          username: variables.username,
          password: variables.password,
        },
        {
          async onSuccess(context) {
            if (context.data.twoFactorRedirect) {
              return router.push("/2fa");
            }

            return router.push("/home");
          },
        },
      );

      if (error) return Promise.reject(error);
    },
    onError: (error: AuthClientError) => {
      if (error.status === RATE_LIMIT_ERROR_CODE) return;

      switch (error.code) {
        case "INVALID_USERNAME_OR_PASSWORD":
          form.setError("username", {
            message: "Usuario o contraseña inválidos.",
          });
          form.setError("password", {
            message: "Usuario o contraseña inválidos.",
          });
          return;

        case "BANNED_USER":
          toast.error("Estás bloqueado de la plataforma 😢", {
            description: "Por favor, contacta al administrador.",
            duration: 20_000,
          });
          return;

        case "EMAIL_NOT_VERIFIED":
          toast.error("Verifica tu correo electrónico para iniciar sesión 📧", {
            description:
              "Revisa tu bandeja de entrada (o carpeta de spam) para el correo de verificación.",
            duration: 10000,
          });
          return;

        default:
          toast.error(
            "Algo salió mal, por favor, inténtalo de nuevo más tarde 😢",
          );
          return;
      }
    },
  });
};
