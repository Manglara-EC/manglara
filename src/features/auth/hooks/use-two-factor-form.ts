import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { twoFactorSchema } from "@/shared/schemas/two-factor";
import type { TwoFactorVariables } from "@/shared/types";

import { useTwoFactorMutation } from "@/features/auth/hooks/use-two-factor-mutation";

export const useTwoFactorForm = () => {
  const form = useForm<TwoFactorVariables>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      code: "",
    },
  });

  const { mutate, isPending } = useTwoFactorMutation({ form });

  const onSubmit = (variables: TwoFactorVariables) => mutate(variables);

  return { form, onSubmit, isPending };
};
