import { PaginationState } from "@tanstack/react-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authClient } from "@/shared/lib/better-auth/client";

import type { UpdateUserVariables, ListUsers } from "@/features/admin/types";

interface Props {
  pagination: PaginationState;
}

export const useUpdateUserMutation = ({ pagination }: Props) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: UpdateUserVariables) => {
      const { data, error } = await authClient.admin.updateUser({
        userId: variables.userId,
        data: {
          name: variables.name,
          username: variables.username,
          displayUsername: variables.username,
          email: variables.email,
          role: variables.role,
        },
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
                  name: variables.name,
                  username: variables.username,
                  email: variables.email,
                  role: variables.role,
                }
              : user,
          ),
        }),
      );

      toast.success("Usuario actualizado exitosamente 🔄");
    },
    onError: () => {
      toast.error("No se pudo actualizar al usuario 😢", {
        description: "Por favor, inténtelo de nuevo más tarde.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "list", pagination] });
    },
  });
};
