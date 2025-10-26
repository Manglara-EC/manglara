import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import { RATE_LIMIT_ERROR_CODE } from "@/shared/constants";
import { authClient } from "@/shared/lib/better-auth/client";
import type { AuthClientError } from "@/shared/types";

import type { UpdatePasswordVariables } from "@/features/settings/types";

interface Props {
  form: UseFormReturn<UpdatePasswordVariables>;
}

export const useUpdatePasswordMutation = ({ form }: Props) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      currentPassword,
      newPassword,
    }: UpdatePasswordVariables) => {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (error) return Promise.reject(error);
    },
    onSuccess: () => {
      toast.success("Contraseña cambiada exitosamente 🎉", {
        duration: 10_000,
      });

      form.reset();
    },
    onError: (error: AuthClientError) => {
      if (error.status === RATE_LIMIT_ERROR_CODE) return;

      switch (error.code) {
        case "INVALID_PASSWORD":
          form.setError("currentPassword", {
            message: "Contraseña inválida",
          });
          return;

        case "PASSWORD_COMPROMISED":
          form.setError("newPassword", {
            message:
              "La contraseña que ingresaste ha sido comprometida. Por favor, elige una contraseña diferente.",
          });
          return;

        default:
          toast.error("No se pudo cambiar la contraseña 😢", {
            description: "Por favor, inténtalo de nuevo más tarde.",
            duration: 10_000,
          });
          return;
      }
    },
    onSettled: () => {
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["session", "detail"] }),
        queryClient.invalidateQueries({ queryKey: ["session", "list"] }),
      ]);
    },
  });
};
