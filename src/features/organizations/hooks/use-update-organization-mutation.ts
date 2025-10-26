import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import slugify from "slugify";
import { useRouter } from "next/navigation";

import { authClient } from "@/shared/lib/better-auth/client";
import { RATE_LIMIT_ERROR_CODE } from "@/shared/constants";
import type { AuthClientError } from "@/shared/types";

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
      let slug: string | undefined = undefined;

      if (variables.slug !== organization.slug) {
        slug = slugify(variables.slug, {
          lower: true,
          strict: true,
          trim: true,
        });

        const { error: slugError } = await authClient.organization.checkSlug({
          slug,
        });

        if (slugError) return Promise.reject(slugError);
      }

      const { data, error } = await authClient.organization.update({
        organizationId: organization.id,
        data: {
          name: variables.name,
          slug,
        },
      });

      if (error) return Promise.reject(error);

      return data;
    },
    onSuccess: (data) => {
      toast.success("Organización actualizada exitosamente 🎉");
      dialogCloseRef.current?.click();

      if (data.slug !== organization.slug)
        router.push(`/organizations/${data.slug}`);

      queryClient.setQueryData(
        ["organization", "list"],
        (old: Organization[]) =>
          old.map((organization) =>
            organization.id === data.id
              ? {
                  ...organization,
                  name: data.name,
                  slug: data.slug,
                }
              : organization,
          ),
      );

      queryClient.setQueryData(
        ["organization", data.id, "detail"],
        (old: Organization) => ({
          ...old,
          name: data.name,
          slug: data.slug,
        }),
      );
    },
    onError: (error: AuthClientError) => {
      if (error.status === RATE_LIMIT_ERROR_CODE) return;

      switch (error.code) {
        case "SLUG_IS_TAKEN":
          form.setError("slug", {
            message: "El slug ya está en uso. Por favor, intenta con otro.",
          });
          return;

        default:
          toast.error("No se pudo actualizar la organización 😢", {
            description: "Por favor, inténtelo de nuevo más tarde.",
          });
          return;
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", "list"] });
      queryClient.invalidateQueries({
        queryKey: ["organization", organization.id, "detail"],
      });
    },
  });
};
