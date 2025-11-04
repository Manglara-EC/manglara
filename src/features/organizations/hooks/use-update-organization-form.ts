import { useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useUpdateOrganizationMutation } from "@/features/organizations/hooks/use-update-organization-mutation";
import { updateOrganizationSchema } from "@/features/organizations/schemas/update-organization";
import type {
  Organization,
  UpdateOrganizationVariables,
} from "@/features/organizations/types";

interface Props {
  organization: Organization;
}

export const useUpdateOrganizationForm = ({ organization }: Props) => {
  const dialogCloseRef = useRef<HTMLButtonElement>(null);

  const form = useForm<UpdateOrganizationVariables>({
    resolver: zodResolver(updateOrganizationSchema),
    defaultValues: {
      name: organization.name,
      slug: organization.slug || "",
    },
  });

  const { mutate, isPending } = useUpdateOrganizationMutation({
    organization,
    form,
    dialogCloseRef,
  });

  const onSubmit = (variables: UpdateOrganizationVariables) =>
    mutate(variables);

  return { form, onSubmit, isPending, dialogCloseRef };
};
