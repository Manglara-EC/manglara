import { useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useCreateOrganizationMutation } from "@/features/organizations/hooks/use-create-organization-mutation";
import { createOrganizationSchema } from "@/features/organizations/schemas/create-organization";
import type { CreateOrganizationVariables } from "@/features/organizations/types";

export const useCreateOrganizationForm = () => {
  const dialogCloseRef = useRef<HTMLButtonElement>(null);

  const form = useForm<CreateOrganizationVariables>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const { mutate, isPending } = useCreateOrganizationMutation({
    form,
    dialogCloseRef,
  });

  const onSubmit = (variables: CreateOrganizationVariables) =>
    mutate(variables);

  return { form, onSubmit, isPending, dialogCloseRef };
};
