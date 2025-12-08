"use server";

import { eq, and, desc, getTableColumns } from "drizzle-orm";

import { db } from "@/shared/lib/drizzle/server";
import { service, organization, user } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

import type { PublicService } from "@/features/services/types";

type ErrorCode = "INTERNAL_SERVER_ERROR";

export const getPublicServices = async (
  organizationId?: string
): Promise<ActionResponse<PublicService[], ErrorCode>> => {
  const whereConditions = [
    eq(service.status, "approved"),
    eq(service.deleted, false),
  ];

  if (organizationId) {
    whereConditions.push(eq(service.organizationId, organizationId));
  }

  const { data: services, error: servicesError } = await tryCatch(
    db
      .select({
        ...getTableColumns(service),
        organizationName: organization.name,
        sellerName: user.name,
      })
      .from(service)
      .innerJoin(organization, eq(service.organizationId, organization.id))
      .innerJoin(user, eq(service.sellerId, user.id))
      .where(and(...whereConditions))
      .orderBy(desc(service.createdAt))
      .limit(50)
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