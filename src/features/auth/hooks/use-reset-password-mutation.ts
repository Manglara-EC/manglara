import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { RATE_LIMIT_ERROR_CODE } from "@/shared/constants";
import { authClient } from "@/shared/lib/better-auth/client";
import type { AuthClientError } from "@/shared/types";

import type { ResetPasswordVariables } from "@/features/auth/types";

interface Props {
  token: string;
}

export const useResetPasswordMutation = ({ token }: Props) => {
  const router = useRouter();

  return useMutation({
    mutationFn: async (variables: ResetPasswordVariables) => {
      const { error } = await authClient.resetPassword({
        newPassword: variables.password,
        token,
      });

      if (error) return Promise.reject(error);
    },
    onSuccess: () => {
      toast.success("Contraseña restablecida exitosamente 🎉", {
        description: "Ahora puedes iniciar sesión con tu nueva contraseña.",
        duration: 10_000,
      });

      router.push("/sign-in");
    },
    onError: (error: AuthClientError) => {
      if (error.status === RATE_LIMIT_ERROR_CODE) return;

      switch (error.code) {
        case "INVALID_TOKEN":
          toast.error("Token inválido 😢", {
            description:
              "Por favor, solicita un nuevo enlace de restablecimiento de contraseña.",
            duration: 10_000,
            action: {
              label: "Solicitar nuevo enlace",
              onClick: () => router.push("/forgot-password"),
            },
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
  });
};
