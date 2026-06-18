"use server";

import { eq, and, desc, getTableColumns, count } from "drizzle-orm";

import { db } from "@/shared/lib/drizzle/server";
import { service, organization, user } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";
import {
  paginationParamsSchema,
  calculateOffset,
  calculatePagination,
  type PaginationResponse,
} from "@/shared/schemas/pagination";

import type { PublicService } from "@/features/services/types";

type ErrorCode = "INTERNAL_SERVER_ERROR" | "INVALID_PARAMS";

export interface GetPublicServicesResponse {
  items: PublicService[];
  pagination: PaginationResponse;
}

export const getPublicServices = async (
  page: number = 1,
  pageSize: number = 50,
  organizationId?: string
): Promise<ActionResponse<GetPublicServicesResponse, ErrorCode>> => {
  // Validar parámetros de paginación
  const validationResult = paginationParamsSchema.safeParse({
    page,
    pageSize,
  });

  if (!validationResult.success) {
    return {
      data: null,
      error: {
        code: "INVALID_PARAMS",
        message: "Invalid pagination parameters",
      },
    };
  }

  const { page: validPage, pageSize: validPageSize } = validationResult.data;
  const offset = calculateOffset(validPage, validPageSize);

  const whereConditions = [
    eq(service.status, "approved"),
    eq(service.deleted, false),
  ];

  if (organizationId) {
    whereConditions.push(eq(service.organizationId, organizationId));
  }

  // Fetch servicios y contar total en paralelo
  const [
    { data: services, error: servicesError },
    { data: countResult, error: countError },
  ] = await Promise.all([
    tryCatch(
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
        .limit(validPageSize)
        .offset(offset)
    ),
    tryCatch(
      db
        .select({ count: count() })
        .from(service)
        .where(and(...whereConditions))
    ),
  ]);

  if (servicesError || countError) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch services",
      },
    };
  }

  const total = countResult?.[0]?.count ?? 0;
  const pagination = calculatePagination(validPage, validPageSize, total);

  return {
    data: {
      items: services ?? [],
      pagination,
    },
    error: null,
  };
};