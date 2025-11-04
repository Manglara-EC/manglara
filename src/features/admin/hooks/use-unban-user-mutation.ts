import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PaginationState } from "@tanstack/react-table";
import { toast } from "sonner";

import { authClient } from "@/shared/lib/better-auth/client";

import type { ListUsers, UnbanUserVariables } from "@/features/admin/types";

interface Props {
  pagination: PaginationState;
}

export const useUnbanUserMutation = ({ pagination }: Props) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: UnbanUserVariables) => {
      const { data, error } = await authClient.admin.unbanUser({
        userId: variables.userId,
      });

      if (error) return Promise.reject(error);

      return data;
    },
    onSuccess: (_data, _variables) => {
      toast.success("Usuario desbloqueado exitosamente ✅");

      queryClient.setQueryData(
        ["user", "list", pagination],
        (old: ListUsers) => ({
          ...old,
          users: old.users.map((user) =>
            user.id === _variables.userId
              ? { ...user, banned: false, banReason: null, banExpires: null }
              : user,
          ),
        }),
      );
    },
    onError: () => {
      toast.error("No se pudo desbloquear al usuario 😢", {
        description: "Por favor, inténtelo de nuevo más tarde.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "list", pagination] });
    },
  });
};
