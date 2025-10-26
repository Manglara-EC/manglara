import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { authClient } from "@/shared/lib/better-auth/client";
import type { AuthClientError } from "@/shared/types";

import type {
  Organization,
  DeleteOrganizationVariables,
} from "@/features/organizations/types";

export const useDeleteOrganizationMutation = () => {
  const queryClient = useQueryClient();

  const router = useRouter();

  return useMutation({
    mutationFn: async (variables: DeleteOrganizationVariables) => {
      const { data, error } = await authClient.organization.delete({
        organizationId: variables.organizationId,
      });

      if (error) return Promise.reject(error);

      if (!data)
        return Promise.reject({
          code: "ORGANIZATION_NOT_FOUND",
          message: "La organización no existe",
        });

      return data;
    },
    onSuccess: (data) => {
      toast.success("Organización eliminada exitosamente 🎉");

      queryClient.setQueryData(
        ["organization", "list"],
        (old: Organization[]) =>
          old.filter((organization) => organization.id !== data.id),
      );

      router.push("/organizations");
      router.refresh();
    },
    onError: (error: AuthClientError) => {
      switch (error.code) {
        case "ORGANIZATION_NOT_FOUND":
          toast.error("La organización no existe 😢", {
            description: "Por favor, inténtelo de nuevo más tarde.",
          });
          return;

        default:
          toast.error("No se pudo eliminar la organización 😢", {
            description: "Por favor, inténtelo de nuevo más tarde.",
          });
          return;
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", "list"] });
    },
  });
};
