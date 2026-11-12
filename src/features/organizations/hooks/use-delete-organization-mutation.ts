import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import type {
  Organization,
  DeleteOrganizationVariables,
} from "@/features/organizations/types";
import { deleteOrganization } from "@/features/organizations/actions/delete-organization";

export const useDeleteOrganizationMutation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (variables: DeleteOrganizationVariables) => {
      const { data, error } = await deleteOrganization(variables);

      if (error) return Promise.reject(error);

      return data;
    },
    onSuccess: (data) => {
      toast.success("Comuna eliminada exitosamente");

      queryClient.setQueryData(
        ["organization", "list"],
        (old: Organization[] | undefined) =>
          old?.filter((organization) => organization.id !== data.id),
      );

      router.push("/organizations");
      router.refresh();
    },
    onError: (error: { code?: string; message?: string }) => {
      toast.error("No se pudo eliminar la comuna", {
        description:
          error.message ?? "Por favor, inténtelo de nuevo más tarde.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", "list"] });
    },
  });
};
