import { PaginationState } from "@tanstack/react-table";

import { useRemoveMemberMutation } from "@/features/organizations/hooks/use-remove-member-mutation";
import type { OrganizationMember } from "@/features/organizations/types";

interface Props {
  member: OrganizationMember;
  pagination: PaginationState;
}

export const useMembersTableRowActions = ({ member, pagination }: Props) => {
  const { mutate: removeMember, isPending: isRemoveMemberPending } =
    useRemoveMemberMutation({
      pagination,
      organizationId: member.organizationId,
    });

  const handleRemoveMember = (event: Event) => {
    event.preventDefault();

    removeMember({
      memberId: member.id,
    });
  };

  return {
    isRemoveMemberPending,
    handleRemoveMember,
  };
};
