import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { forgotPasswordSchema } from "@/features/auth/schemas/forgot-password";
import { useForgotPasswordMutation } from "@/features/auth/hooks/use-forgot-password-mutation";
import type { ForgotPasswordVariables } from "@/features/auth/types";

export const useForgotPasswordForm = () => {
  const form = useForm<ForgotPasswordVariables>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const { mutate, isPending } = useForgotPasswordMutation();

  const onSubmit = (variables: ForgotPasswordVariables) => mutate(variables);

  return {
    form,
    onSubmit,
    isPending,
  };
};
