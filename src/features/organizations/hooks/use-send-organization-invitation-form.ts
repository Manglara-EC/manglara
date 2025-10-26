import { useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useSendOrganizationInvitationMutation } from "@/features/organizations/hooks/use-send-organization-invitation-mutation";
import { sendOrganizationInvitationSchema } from "@/features/organizations/schemas/send-organization-invitation";
import type { SendOrganizationInvitationVariables } from "@/features/organizations/types";

interface Props {
  organizationId: string;
}

export const useSendOrganizationInvitationForm = ({
  organizationId,
}: Props) => {
  const dialogCloseRef = useRef<HTMLButtonElement>(null);

  const form = useForm<SendOrganizationInvitationVariables>({
    resolver: zodResolver(sendOrganizationInvitationSchema),
    defaultValues: {
      email: "",
    },
  });

  const { mutate, isPending } = useSendOrganizationInvitationMutation({
    form,
    dialogCloseRef,
    organizationId,
  });

  const onSubmit = (variables: SendOrganizationInvitationVariables) =>
    mutate(variables);

  return { form, onSubmit, isPending, dialogCloseRef };
};
