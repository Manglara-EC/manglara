"use server";

import { headers } from "next/headers";
import { eq, and, desc, inArray, getTableColumns } from "drizzle-orm";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { service, organization, member, user } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

import type { PendingServiceWithDetails } from "@/features/owner/types";

type ErrorCode = "UNAUTHORIZED" | "FORBIDDEN" | "INTERNAL_SERVER_ERROR";

export const getPendingServices = async (): Promise <
  ActionResponse<PendingServiceWithDetails[], ErrorCode>
> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "You must be logged in",
      },
    };
  }

  const { data: myOrganizations, error: orgError } = await tryCatch(
    db.query.member.findMany({
      where: and(
        eq(member.userId, session.user.id),
        eq(member.role, "owner")
      ),
    })
  );

  if (orgError) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch organizations",
      },
    };
  }

  const orgIds = myOrganizations?.map(m => m.organizationId) ?? [];

  if (orgIds.length === 0) {
    return { data: [], error: null };
  }

  const { data: services, error: servicesError } = await tryCatch(
    db
      .select({
        ...getTableColumns(service),
        sellerName: user.name,
        sellerEmail: user.email,
        organizationName: organization.name,
      })
      .from(service)
      .innerJoin(user, eq(service.sellerId, user.id))
      .innerJoin(organization, eq(service.organizationId, organization.id))
      .where(
        and(
          inArray(service.organizationId, orgIds),
          eq(service.status, "pending"),
          eq(service.deleted, false)
        )
      )
      .orderBy(desc(service.createdAt))
  );

  if (servicesError) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch services",
      },
    };
  }

  return {
    data: services ?? [],
    error: null,
  };
};