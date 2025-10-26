import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useRecoveryMutation } from "@/features/auth/hooks/use-recovery-mutation";
import { recoverySchema } from "@/features/auth/schemas/recovery";
import type { RecoveryVariables } from "@/features/auth/types";

export const useRecoveryForm = () => {
  const form = useForm<RecoveryVariables>({
    resolver: zodResolver(recoverySchema),
    defaultValues: {
      code: "",
    },
  });

  const { mutate, isPending } = useRecoveryMutation({ form });

  const onSubmit = (variables: RecoveryVariables) => mutate(variables);

  return { form, onSubmit, isPending };
};
