import { UseFormReturn } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { RATE_LIMIT_ERROR_CODE } from "@/shared/constants";
import { authClient } from "@/shared/lib/better-auth/client";
import type { AuthClientError } from "@/shared/types";
import { getHash } from "@/shared/utils/get-hash";

import type { SignUpVariables } from "@/features/auth/types";

interface Props {
  form: UseFormReturn<SignUpVariables>;
}

export const useSignUpEmailMutation = ({ form }: Props) => {
  return useMutation({
    mutationFn: async (variables: SignUpVariables) => {
      const hash = await getHash(variables.email);
      const image = `https://gravatar.com/avatar/${hash}?size=500&d=robohash&r=x`;

      const { data, error } = await authClient.signUp.email({
        email: variables.email,
        password: variables.password,
        name: variables.name,
        username: variables.username,
        displayUsername: variables.username,
        image,
        callbackURL: "/home",
      });

      if (error) return Promise.reject(error);

      return data;
    },
    onSuccess: () => {
      toast.success("Cuenta creada exitosamente 🎉", {
        description:
          "Revisa tu bandeja de entrada (o carpeta de spam) para el correo de verificación.",
        duration: 10_000,
      });

      form.reset();
    },
    onError: (error: AuthClientError, variables) => {
      if (error.status === RATE_LIMIT_ERROR_CODE) return;

      switch (error.code) {
        case "USERNAME_IS_ALREADY_TAKEN_PLEASE_TRY_ANOTHER":
          form.setError("username", {
            message:
              "El nombre de usuario ya está en uso. Por favor, intenta con otro.",
          });
          return;

        case "USER_ALREADY_EXISTS":
          form.setError("email", {
            message: "Un usuario con ese correo electrónico ya existe",
          });
          return;

        case "PASSWORD_COMPROMISED":
          form.setError("password", {
            message:
              "La contraseña está comprometida. Por favor, elige una contraseña más segura.",
          });
          return;

        case "FAILED_TO_SEND_VERIFICATION_EMAIL":
          const toastId = toast.error(
            "No se pudo enviar el correo de verificación 😢",
            {
              duration: 10_000,
              action: {
                label: "Reenviar correo",
                onClick: async () => {
                  const id = toast.loading("Reenviando correo...");

                  const { error } = await authClient.sendVerificationEmail({
                    email: variables.email,
                    callbackURL: "/home",
                  });

                  if (error) {
                    if (error.status === 429) return;

                    toast.dismiss(id);
                    toast.error("No se pudo reenviar el correo 😢", {
                      id: toastId,
                      duration: 10_000,
                    });
                    return;
                  }

                  toast.success("Correo enviado exitosamente 🎉", {
                    id,
                    description:
                      "Revisa tu bandeja de entrada (o carpeta de spam) para el correo de verificación.",
                    duration: 10_000,
                  });
                },
              },
            },
          );
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
