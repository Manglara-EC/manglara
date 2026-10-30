import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getViewer } from "@/shared/lib/authz/server";

export const metadata: Metadata = {
  title: "Manglara | Panel del Vendedor",
};

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await getViewer();

  if (!viewer) redirect("/sign-in");

  // El panel es para quien vende en al menos una comuna (seller/admin/owner)
  if (!viewer.access.canSell) redirect("/home");

  return <div className="container mx-auto py-6">{children}</div>;
}
