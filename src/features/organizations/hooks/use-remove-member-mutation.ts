import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PaginationState } from "@tanstack/react-table";
import { toast } from "sonner";

import { authClient } from "@/shared/lib/better-auth/client";

import type {
  ListMembers,
  RemoveMemberVariables,
} from "@/features/organizations/types";

interface Props {
  pagination: PaginationState;
  organizationId: string;
}

export const useRemoveMemberMutation = ({
  pagination,
  organizationId,
}: Props) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: RemoveMemberVariables) => {
      const { error } = await authClient.organization.removeMember({
        memberIdOrEmail: variables.memberId,
        organizationId,
      });

      if (error) return Promise.reject(error);
    },
    onError: () => {
      toast.error("No se pudo eliminar al miembro 😢", {
        description: "Por favor, inténtelo de nuevo más tarde.",
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.setQueryData(
        ["organization", organizationId, "member", "list", pagination],
        (old: ListMembers) => ({
          ...old,
          members: old.members.filter(
            (member) => member.id !== variables.memberId,
          ),
          total: old.total - 1,
        }),
      );

      queryClient.setQueryData(
        ["organization", organizationId, "member", "total"],
        (old: number) => old - 1,
      );

      toast.success("Miembro eliminado exitosamente 🎉");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "organization",
          organizationId,
          "member",
          "list",
          pagination,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["organization", organizationId, "member", "total"],
      });
    },
  });
};
