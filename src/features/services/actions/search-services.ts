"use server";

import { eq, and, desc, gte, lte, ilike, getTableColumns } from "drizzle-orm";

import { db } from "@/shared/lib/drizzle/server";
import { service, organization, user } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

import type {
  PublicService,
  ServiceSearchParams,
} from "@/features/services/types";

type ErrorCode = "INTERNAL_SERVER_ERROR";

export const searchServices = async (
  params: ServiceSearchParams,
): Promise<ActionResponse<PublicService[], ErrorCode>> => {
  const {
    query,
    organizationId,
    minPrice,
    maxPrice,
    limit = 50,
    offset = 0,
  } = params;

  const whereConditions = [
    eq(service.status, "approved"),
    eq(service.deleted, false),
  ];

  if (query) {
    whereConditions.push(ilike(service.name, `%${query}%`));
  }

  if (organizationId) {
    whereConditions.push(eq(service.organizationId, organizationId));
  }

  if (minPrice !== undefined) {
    whereConditions.push(gte(service.price, minPrice.toString()));
  }

  if (maxPrice !== undefined) {
    whereConditions.push(lte(service.price, maxPrice.toString()));
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
      .limit(limit)
      .offset(offset),
  );

  if (servicesError) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to search services",
      },
    };
  }

  return {
    data: services ?? [],
    error: null,
  };
};
