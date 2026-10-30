import { useRemoveMemberMutation } from "@/features/organizations/hooks/use-remove-member-mutation";
import { useUpdateMemberRoleMutation } from "@/features/organizations/hooks/use-update-member-role-mutation";
import type { OrganizationMember } from "@/features/organizations/types";
import type { OrganizationRole } from "@/shared/constants/roles";

interface Props {
  member: OrganizationMember;
}

export const useMembersTableRowActions = ({ member }: Props) => {
  const { mutate: removeMember, isPending: isRemoveMemberPending } =
    useRemoveMemberMutation({ organizationId: member.organizationId });

  const { mutate: updateRole, isPending: isUpdateRolePending } =
    useUpdateMemberRoleMutation({ organizationId: member.organizationId });

  const handleRemoveMember = (event: Event) => {
    event.preventDefault();
    removeMember({ memberId: member.id });
  };

  const handleUpdateRole = (role: OrganizationRole) => {
    if (role === member.role) return;
    updateRole({ memberId: member.id, role });
  };

  return {
    isPending: isRemoveMemberPending || isUpdateRolePending,
    handleRemoveMember,
    handleUpdateRole,
  };
};
