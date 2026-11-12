import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { updateOrganization } from "@/features/organizations/actions/update-organization";

import type {
  Organization,
  UpdateOrganizationVariables,
} from "@/features/organizations/types";

interface Props {
  form: UseFormReturn<UpdateOrganizationVariables>;
  dialogCloseRef: React.RefObject<HTMLButtonElement | null>;
  organization: Organization;
}

export const useUpdateOrganizationMutation = ({
  organization,
  form,
  dialogCloseRef,
}: Props) => {
  const queryClient = useQueryClient();

  const router = useRouter();

  return useMutation({
    mutationFn: async (variables: UpdateOrganizationVariables) => {
      const { data, error } = await updateOrganization({
        organizationId: organization.id,
        ...variables,
      });

      if (error) return Promise.reject(error);

      return data;
    },
    onSuccess: (data) => {
      toast.success("Organización actualizada exitosamente 🎉");
      dialogCloseRef.current?.click();

      if (data.slug !== organization.slug)
        router.push(`/organizations/${data.slug}`);
      else router.refresh();

      queryClient.setQueryData(
        ["organization", "list"],
        (old: Organization[] | undefined) =>
          old?.map((organization) =>
            organization.id === data.id
              ? {
                  ...organization,
                  name: data.name,
                  slug: data.slug,
                }
              : organization,
          ),
      );
    },
    onError: (error: { code?: string; message?: string }) => {
      switch (error.code) {
        case "SLUG_IS_TAKEN":
          form.setError("slug", {
            message: "El slug ya está en uso. Por favor, intenta con otro.",
          });
          return;

        default:
          toast.error("No se pudo actualizar la comuna", {
            description:
              error.message ?? "Por favor, inténtelo de nuevo más tarde.",
          });
          return;
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", "list"] });
    },
  });
};
