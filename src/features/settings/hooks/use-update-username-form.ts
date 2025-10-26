import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useSession } from "@/shared/hooks/use-session";

import { useUpdateUsernameMutation } from "@/features/settings/hooks/use-update-username-mutation";
import { updateUsernameSchema } from "@/features/settings/schemas/update-username";
import type { UpdateUsernameVariables } from "@/features/settings/types";

export const useUpdateUsernameForm = () => {
  const {
    data: session,
    isSuccess: isSessionSuccess,
    isLoading: isSessionLoading,
    isError: isSessionError,
    refetch: refetchSession,
    isRefetching: isSessionRefetching,
  } = useSession();

  const form = useForm<UpdateUsernameVariables>({
    resolver: zodResolver(updateUsernameSchema),
    values: {
      username: session?.user.displayUsername ?? "",
    },
  });

  const { mutate, isPending, isError } = useUpdateUsernameMutation({
    form,
  });

  const { isDirty, isValid } = form.formState;

  const canSubmit =
    isDirty &&
    isValid &&
    form.watch("username").trim() !== session?.user.displayUsername;

  const onSubmit = (variables: UpdateUsernameVariables) => mutate(variables);

  return {
    form,
    canSubmit,
    onSubmit,
    isPending,
    isError,
    session,
    isSessionSuccess,
    isSessionLoading,
    isSessionError,
    refetchSession,
    isSessionRefetching,
  };
};
