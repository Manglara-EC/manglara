import type { Metadata } from "next";
import { headers } from "next/headers";
import { asc } from "drizzle-orm";

import {
  TypographyH1,
  TypographyMuted,
} from "@/shared/components/ui/typography";
import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { organization } from "@/shared/lib/drizzle/schema";
import { canAccessOrganizations } from "@/features/organizations/actions/can-access-organizations";
import { ExploreCatalog } from "@/features/items/components/explore-catalog";

export const metadata: Metadata = {
  title: "Manglara | Explore",
};

export default async function ExplorePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const showCommuneFilter = !session || !(await canAccessOrganizations());
  const communes = showCommuneFilter
    ? await db
        .select({ id: organization.id, name: organization.name })
        .from(organization)
        .orderBy(asc(organization.name))
    : null;

  return (
    <main className="flex flex-col gap-6">
      <div className="space-y-2">
        <TypographyH1>Explorar</TypographyH1>

        <TypographyMuted>Explora el mundo de Manglara. 🌴</TypographyMuted>
      </div>

      <ExploreCatalog communes={communes} />
    </main>
  );
}
