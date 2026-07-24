import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { APIError } from "better-auth";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { auth } from "@/shared/lib/better-auth/server";
import { tryCatch } from "@/shared/utils/try-catch";

import { DeleteOrganizationButton } from "@/features/organizations/components/delete-organization-button";
import { OrganizationPageHeader } from "@/features/organizations/components/organization-page-header";
import { OrganizationMembers } from "@/features/organizations/components/organization-members";
import { OrganizationInvitations } from "@/features/organizations/components/organization-invitations";
import { OrganizationItemsView } from "@/features/organizations/components/organization-items-view";
import { OrganizationPublicView } from "@/features/organizations/components/organization-public-view";
import { getOrganizationBySlug } from "@/features/organizations/actions/get-organization-by-slug";

export const metadata: Metadata = {
  title: "Manglara | Organizaciones",
};

export default async function OrganizationsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Primero obtener info básica de la organización
  const { data: orgInfo, error: orgInfoError } =
    await getOrganizationBySlug(slug);

  if (orgInfoError?.code === "NOT_FOUND" || !orgInfo) {
    return notFound();
  }

  // Si el usuario NO es miembro, mostrar vista pública
  if (!orgInfo.isMember) {
    return <OrganizationPublicView organization={orgInfo} />;
  }

  // Si es miembro, obtener datos completos
  const { data, error } = await tryCatch(
    auth.api.getFullOrganization({
      query: {
        organizationSlug: slug,
      },
      headers: await headers(),
    }),
  );

  if (error || !data) {
    return <OrganizationPublicView organization={orgInfo} />;
  }

  // Obtener sesión para saber el rol del usuario
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Obtener el rol del usuario actual en esta organización
  const currentUserMember = data.members?.find(
    (member) => member.userId === session?.user?.id,
  );
  const userRoleInOrg = currentUserMember?.role ?? "member";
  const canManageOrg = userRoleInOrg === "owner" || userRoleInOrg === "admin";

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["organization", "detail", data.id, data],
    queryFn: () => data,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OrganizationPageHeader organizationId={data.id} />

      {canManageOrg && <OrganizationItemsView organizationId={data.id} />}

      <OrganizationMembers organizationId={data.id} readOnly={!canManageOrg} />

      {canManageOrg && <OrganizationInvitations organizationId={data.id} />}

      {canManageOrg && <DeleteOrganizationButton organizationId={data.id} />}
    </HydrationBoundary>
  );
}
