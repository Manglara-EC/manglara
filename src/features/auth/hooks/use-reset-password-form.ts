import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useResetPasswordMutation } from "@/features/auth/hooks/use-reset-password-mutation";
import { resetPasswordSchema } from "@/features/auth/schemas/reset-password";
import type { ResetPasswordVariables } from "@/features/auth/types";

export const useResetPasswordForm = () => {
  const form = useForm<ResetPasswordVariables>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const searchParams = useSearchParams();

  const token = searchParams.get("token")!;

  const { mutate, isPending } = useResetPasswordMutation({ token });

  const onSubmit = (variables: ResetPasswordVariables) => mutate(variables);

  return {
    form,
    onSubmit,
    isPending,
  };
};
