import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import { RATE_LIMIT_ERROR_CODE } from "@/shared/constants";
import { authClient } from "@/shared/lib/better-auth/client";
import type { AuthClientError, TwoFactorVariables } from "@/shared/types";

interface Props {
  form: UseFormReturn<TwoFactorVariables>;
}

export const useTwoFactorMutation = ({ form }: Props) => {
  const router = useRouter();

  return useMutation({
    mutationFn: async (variables: TwoFactorVariables) => {
      const { error } = await authClient.twoFactor.verifyTotp({
        code: variables.code,
      });

      if (error) return Promise.reject(error);
    },
    onSuccess: () => {
      router.push("/home");
    },
    onError: (error: AuthClientError) => {
      if (error.status === RATE_LIMIT_ERROR_CODE) return;

      switch (error.code) {
        case "INVALID_TWO_FACTOR_AUTHENTICATION":
          form.setError("code", {
            message: "Código de verificación inválido",
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
