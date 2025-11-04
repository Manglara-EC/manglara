import { PaginationState } from "@tanstack/react-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authClient } from "@/shared/lib/better-auth/client";

import type { BanUserVariables, ListUsers } from "@/features/admin/types";

interface Props {
  pagination: PaginationState;
}

export const useBanUserMutation = ({ pagination }: Props) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: BanUserVariables) => {
      const { data, error } = await authClient.admin.banUser({
        userId: variables.userId,
        banReason: variables.banReason,
        banExpiresIn: variables.banExpiresIn,
      });

      if (error) return Promise.reject(error);

      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.setQueryData(
        ["user", "list", pagination],
        (old: ListUsers) => ({
          ...old,
          users: old.users.map((user) =>
            user.id === variables.userId
              ? {
                  ...user,
                  banned: true,
                  banExpires: variables.banExpiresIn
                    ? new Date(Date.now() + variables.banExpiresIn * 1000)
                    : null,
                  banReason: variables.banReason ?? "No reason",
                }
              : user,
          ),
        }),
      );

      toast.success("Usuario bloqueado exitosamente 🚫");
    },
    onError: () => {
      toast.error("No se pudo bloquear al usuario 😢", {
        description: "Por favor, inténtelo de nuevo más tarde.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "list", pagination] });
    },
  });
};
