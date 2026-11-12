"use server";

import { headers } from "next/headers";
import { and, eq, inArray } from "drizzle-orm";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { member } from "@/shared/lib/drizzle/schema";

export async function canAccessOrganizations(): Promise<boolean> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return false;

  if (session.user.role === "seller" || session.user.role === "admin") {
    return true;
  }

  const managedMembership = await db.query.member.findFirst({
    where: and(
      eq(member.userId, session.user.id),
      inArray(member.role, ["owner", "admin"]),
    ),
    columns: { id: true },
  });

  return Boolean(managedMembership);
}
