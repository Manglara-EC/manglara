"use client";

import { TypographyH4 } from "@/shared/components/ui/typography";

import { MembersTable } from "@/features/organizations/components/members-table";
import { useOrganizationMembers } from "@/features/organizations/hooks/use-organization-members";
import type { MembersTableViewer } from "@/features/organizations/types";

interface Props {
  organizationId: string;
  viewer: MembersTableViewer;
}

export const OrganizationMembers = ({ organizationId, viewer }: Props) => {
  const { total } = useOrganizationMembers({ organizationId });

  return (
    <div className="space-y-8 pb-8">
      <TypographyH4>Miembros ({total})</TypographyH4>

      <MembersTable organizationId={organizationId} viewer={viewer} />
    </div>
  );
};
