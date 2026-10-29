import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import { RATE_LIMIT_ERROR_CODE } from "@/shared/constants";
import { authClient } from "@/shared/lib/better-auth/client";
import { getPostAuthRedirect } from "@/shared/utils/redirect";
import type { AuthClientError } from "@/shared/types";

import type { RecoveryVariables } from "@/features/auth/types";

interface Props {
  form: UseFormReturn<RecoveryVariables>;
}

export const useRecoveryMutation = ({ form }: Props) => {
  const router = useRouter();

  return useMutation({
    mutationFn: async (variables: RecoveryVariables) => {
      const { error } = await authClient.twoFactor.verifyBackupCode({
        code: variables.code,
      });

      if (error) return Promise.reject(error);
    },
    onSuccess: () => {
      toast.info(
        "Por favor, ten en cuenta que cada código de recuperación solo puede usarse una vez. Si has usado todos tus códigos de recuperación, puedes generar nuevos en tus ajustes de cuenta. Si no recuerdas tu contraseña, este es un buen momento para restablecerla.",
        {
          dismissible: false,
          closeButton: true,
          duration: 20_000,
          action: {
            label: "Ir a ajustes",
            onClick: () => router.push("/settings/security"),
          },
        },
      );

      router.push(getPostAuthRedirect());
    },
    onError: (error: AuthClientError) => {
      if (error.status === RATE_LIMIT_ERROR_CODE) return;

      switch (error.code) {
        case "INVALID_BACKUP_CODE":
          form.setError("code", {
            message: "Código inválido",
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
