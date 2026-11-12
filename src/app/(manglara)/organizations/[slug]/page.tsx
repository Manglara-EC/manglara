import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getAccess } from "@/shared/lib/authz/server";
import { can } from "@/shared/lib/authz/access";
import {
  ASSIGNABLE_ORGANIZATION_ROLES,
  normalizeOrganizationRole,
} from "@/shared/constants/roles";

import { DeleteOrganizationButton } from "@/features/organizations/components/delete-organization-button";
import { OrganizationPageHeader } from "@/features/organizations/components/organization-page-header";
import { OrganizationMembers } from "@/features/organizations/components/organization-members";
import { OrganizationInvitations } from "@/features/organizations/components/organization-invitations";
import { OrganizationItemsView } from "@/features/organizations/components/organization-items-view";
import { OrganizationPublicView } from "@/features/organizations/components/organization-public-view";
import { OrganizationStats } from "@/features/organizations/components/organization-stats";
import { AddOrganizationMember } from "@/features/organizations/components/add-organization-member";
import { OrganizationStore } from "@/features/items/components/organization-store";
import { getOrganizationBySlug } from "@/features/organizations/actions/get-organization-by-slug";
import type { MembersTableViewer } from "@/features/organizations/types";

export const metadata: Metadata = {
  title: "Manglara | Organizaciones",
};

/**
 * Vista de una comuna según los permisos efectivos del usuario en ella:
 * - No miembro: vista pública con la tienda.
 * - Miembro: miembros (sin correos) y tienda.
 * - Vendedor: además, sus propios ítems en la comuna.
 * - Administrador de la comuna: estadísticas, todos los ítems con moderación,
 *   correos, gestión de miembros e invitaciones.
 * - Administrador global: gestión de cualquier comuna y zona de peligro.
 *
 * No se serializa la organización completa (correos/invitaciones) en el HTML:
 * cada sección pide al servidor solo lo que el usuario puede ver.
 */
export default async function OrganizationsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: organization, error } = await getOrganizationBySlug(slug);

  if (error?.code === "UNAUTHORIZED") redirect("/sign-in");

  if (!organization) return notFound();

  const permissions = new Set(organization.permissions);

  if (!permissions.has("organization:view_members")) {
    return <OrganizationPublicView organization={organization} />;
  }

  const access = await getAccess();
  const viewerRole = organization.viewerRole
    ? normalizeOrganizationRole(organization.viewerRole)
    : null;

  const canViewAllItems = permissions.has("item:view_all");
  const canSellHere = permissions.has("item:create");
  // Las invitaciones de better-auth exigen ser miembro de la comuna
  const canInvite =
    organization.isMember && permissions.has("invitation:create");

  const membersViewer: MembersTableViewer = {
    userId: access.userId,
    viewerRole,
    isPlatformAdmin: organization.isPlatformAdmin,
    canSeeEmails: permissions.has("organization:view_member_emails"),
    canManageMembers:
      permissions.has("member:update_role") || permissions.has("member:remove"),
  };

  return (
    <>
      <OrganizationPageHeader organization={organization} />

      {permissions.has("organization:view_stats") && (
        <OrganizationStats organizationId={organization.id} />
      )}

      {(canViewAllItems || canSellHere) && (
        <OrganizationItemsView
          organizationId={organization.id}
          scope={canViewAllItems ? "all" : "own"}
        />
      )}

      {!canViewAllItems && (
        <OrganizationStore organizationId={organization.id} />
      )}

      <OrganizationMembers
        organizationId={organization.id}
        viewer={membersViewer}
      />

      {organization.isPlatformAdmin && (
        <AddOrganizationMember organizationId={organization.id} />
      )}

      {canInvite && viewerRole && (
        <OrganizationInvitations
          organizationId={organization.id}
          assignableRoles={ASSIGNABLE_ORGANIZATION_ROLES[viewerRole]}
        />
      )}

      {can(access, "organization:delete") && (
        <DeleteOrganizationButton
          organizationId={organization.id}
          organizationName={organization.name}
        />
      )}
    </>
  );
}
