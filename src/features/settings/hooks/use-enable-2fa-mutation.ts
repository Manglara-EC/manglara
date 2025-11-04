import { Dispatch, RefObject, SetStateAction } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import { RATE_LIMIT_ERROR_CODE } from "@/shared/constants";
import { authClient } from "@/shared/lib/better-auth/client";
import type { AuthClientError, Session } from "@/shared/types";

import type { UpdateTwoFactorVariables } from "@/features/settings/types";

interface Props {
  form: UseFormReturn<UpdateTwoFactorVariables>;
  setTotpURI: Dispatch<SetStateAction<string>>;
  setBackupCodes: Dispatch<SetStateAction<string[]>>;
  dialogTriggerRef: RefObject<HTMLButtonElement | null>;
}

export const useEnable2FAMutation = ({
  form,
  dialogTriggerRef,
  setBackupCodes,
  setTotpURI,
}: Props) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      variables: Pick<UpdateTwoFactorVariables, "password">,
    ) => {
      const { data, error } = await authClient.twoFactor.enable({
        password: variables.password,
      });

      if (error) return Promise.reject(error);

      return data;
    },
    onSuccess: (data) => {
      setTotpURI(data.totpURI);
      setBackupCodes(data.backupCodes);
      dialogTriggerRef.current?.click();

      queryClient.setQueryData(
        ["session", "detail"],
        (old: Session): Session => {
          return {
            session: old.session,
            user: { ...old.user, twoFactorEnabled: true },
          };
        },
      );

      form.reset({ enable2FA: true });
    },
    onError: (error: AuthClientError) => {
      if (error.status === RATE_LIMIT_ERROR_CODE) return;

      switch (error.code) {
        case "INVALID_PASSWORD":
          form.setError("password", {
            message: "Contraseña inválida",
          });
          return;

        default:
          toast.error("No se pudo habilitar 2FA 😢", {
            description: "Por favor, inténtalo de nuevo más tarde.",
            duration: 10_000,
          });
          return;
      }
    },
  });
};
