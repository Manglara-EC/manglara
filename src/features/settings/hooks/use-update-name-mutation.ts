import { UseFormReturn } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { RATE_LIMIT_ERROR_CODE } from "@/shared/constants";
import { authClient } from "@/shared/lib/better-auth/client";
import type { AuthClientError, Session } from "@/shared/types";

import type { UpdateNameVariables } from "@/features/settings/types";

interface Props {
  form: UseFormReturn<UpdateNameVariables>;
}

export const useUpdateNameMutation = ({ form }: Props) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: UpdateNameVariables) => {
      const { error } = await authClient.updateUser({
        name: variables.name,
      });

      if (error) return Promise.reject(error);
    },
    onSuccess: (_data, variables) => {
      toast.success("Nombre actualizado exitosamente 🎉", {
        duration: 10_000,
      });

      queryClient.setQueryData(["session", "detail"], (old: Session) => ({
        ...old,
        user: {
          ...old.user,
          name: variables.name,
        },
      }));

      form.reset({ name: variables.name });
    },
    onError: (error: AuthClientError) => {
      if (error.status === RATE_LIMIT_ERROR_CODE) return;

      switch (error.code) {
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
