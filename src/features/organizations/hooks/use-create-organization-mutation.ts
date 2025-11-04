import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import slugify from "slugify";
import { useRouter } from "next/navigation";

import { authClient } from "@/shared/lib/better-auth/client";
import { RATE_LIMIT_ERROR_CODE } from "@/shared/constants";
import type { AuthClientError } from "@/shared/types";
import { getHash } from "@/shared/utils/get-hash";

import type {
  CreateOrganizationVariables,
  Organization,
} from "@/features/organizations/types";

interface Props {
  form: UseFormReturn<CreateOrganizationVariables>;
  dialogCloseRef: React.RefObject<HTMLButtonElement | null>;
}

export const useCreateOrganizationMutation = ({
  form,
  dialogCloseRef,
}: Props) => {
  const queryClient = useQueryClient();

  const router = useRouter();

  return useMutation({
    mutationFn: async (variables: CreateOrganizationVariables) => {
      const hash = await getHash(variables.slug);
      const logo = `https://gravatar.com/avatar/${hash}?size=500&d=robohash&r=x`;

      const slug = slugify(variables.slug, {
        lower: true,
        strict: true,
        trim: true,
      });

      const { data, error } = await authClient.organization.create({
        name: variables.name,
        slug,
        logo,
      });

      if (error) return Promise.reject(error);

      return data;
    },
    onSuccess: (data) => {
      toast.success("Organización creada exitosamente 🎉");
      dialogCloseRef.current?.click();

      queryClient.setQueryData(
        ["organization", "list"],
        (old: Organization[] = []) => [...old, data],
      );

      router.refresh();
    },
    onError: (error: AuthClientError) => {
      if (error.status === RATE_LIMIT_ERROR_CODE) return;

      switch (error.code) {
        case "ORGANIZATION_ALREADY_EXISTS":
          form.setError("slug", {
            message: "El slug ya está en uso. Por favor, intenta con otro.",
          });
          return;

        default:
          toast.error("No se pudo crear la organización 😢", {
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
