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

export const metadata: Metadata = {
  title: "Manglara | Organizaciones",
};

export default async function OrganizationsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data, error } = await tryCatch(
    auth.api.getFullOrganization({
      query: {
        organizationSlug: slug,
        membersLimit: 0,
      },
      headers: await headers(),
    }),
  );

  if ((error as APIError)?.body?.code === "ORGANIZATION_NOT_FOUND")
    return notFound();

  if (error || !data)
    throw new Error(
      "Algo salió mal mientras se obtenía los datos de la organización",
    );

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ["organization", "detail", data.id],
    queryFn: () => data,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OrganizationPageHeader organizationId={data.id} />

      <OrganizationMembers organizationId={data.id} />

      <OrganizationInvitations organizationId={data.id} />

      <DeleteOrganizationButton organizationId={data.id} />
    </HydrationBoundary>
  );
}
