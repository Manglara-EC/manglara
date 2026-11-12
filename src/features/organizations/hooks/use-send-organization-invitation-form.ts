import { useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useSendOrganizationInvitationMutation } from "@/features/organizations/hooks/use-send-organization-invitation-mutation";
import { sendOrganizationInvitationSchema } from "@/features/organizations/schemas/send-organization-invitation";
import type { SendOrganizationInvitationVariables } from "@/features/organizations/types";
import {
  OrganizationRole,
  type OrganizationRole as OrganizationRoleType,
} from "@/shared/constants/roles";

interface Props {
  organizationId: string;
  assignableRoles: readonly OrganizationRoleType[];
}

export const useSendOrganizationInvitationForm = ({
  organizationId,
  assignableRoles,
}: Props) => {
  const dialogCloseRef = useRef<HTMLButtonElement>(null);

  const form = useForm<SendOrganizationInvitationVariables>({
    resolver: zodResolver(sendOrganizationInvitationSchema),
    defaultValues: {
      email: "",
      role: assignableRoles.includes(OrganizationRole.SELLER)
        ? OrganizationRole.SELLER
        : assignableRoles[0],
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
