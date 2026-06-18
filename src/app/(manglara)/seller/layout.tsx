import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/shared/lib/better-auth/server";

export const metadata: Metadata = {
  title: "Manglara | Panel del Vendedor",
};

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Verificar que el usuario sea seller o admin
  if (!session || (session.user.role !== "seller" && session.user.role !== "admin")) {
    redirect("/home");
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto py-6 pb-20">
        {children}
      </div>
    </div>
  );
}
