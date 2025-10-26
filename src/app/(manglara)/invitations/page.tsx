import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AcceptOrRejectInvitationForm } from "@/features/organizations/components/accept-or-reject-invitation-form";

export const metadata: Metadata = {
  title: "Manglara | Invitaciones",
};

export default async function InvitationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { invitationId } = await searchParams;

  if (!invitationId) return notFound();

  return (
    <main className="flex h-full flex-1 flex-col items-center justify-center">
      <AcceptOrRejectInvitationForm invitationId={invitationId as string} />
    </main>
  );
}
