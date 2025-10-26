import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import { RATE_LIMIT_ERROR_CODE } from "@/shared/constants";
import { authClient } from "@/shared/lib/better-auth/client";
import type { AuthClientError } from "@/shared/types";

import type { UpdateUsernameVariables } from "@/features/settings/types";

interface Props {
  form: UseFormReturn<UpdateUsernameVariables>;
}

export const useUpdateUsernameMutation = ({ form }: Props) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: UpdateUsernameVariables) => {
      const { error } = await authClient.updateUser({
        username: variables.username,
        displayUsername: variables.username,
      });

      if (error) return Promise.reject(error);
    },
    onSuccess: (_data, values) => {
      toast.success("Nombre de usuario actualizado exitosamente 🎉", {
        duration: 10_000,
      });

      form.reset({ username: values.username });
    },
    onError: (error: AuthClientError) => {
      if (error.status === RATE_LIMIT_ERROR_CODE) return;

      switch (error.code) {
        case "USERNAME_IS_ALREADY_TAKEN_PLEASE_TRY_ANOTHER":
          form.setError("username", {
            message:
              "El nombre de usuario ya está en uso. Por favor, intenta con otro.",
          });
          return;

        default:
          toast.error("No se pudo cambiar el nombre de usuario 😢", {
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
