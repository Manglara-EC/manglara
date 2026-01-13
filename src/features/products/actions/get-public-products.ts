"use server";

import { eq, and, desc, getTableColumns, count } from "drizzle-orm";

import { db } from "@/shared/lib/drizzle/server";
import { product, organization, user } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";
import {
  paginationParamsSchema,
  calculateOffset,
  calculatePagination,
  type PaginationResponse,
} from "@/shared/schemas/pagination";

import type { PublicProduct } from "@/features/products/types";

type ErrorCode = "INTERNAL_SERVER_ERROR" | "INVALID_PARAMS";

export interface GetPublicProductsResponse {
  items: PublicProduct[];
  pagination: PaginationResponse;
}

export const getPublicProducts = async (
  page: number = 1,
  pageSize: number = 50,
  organizationId?: string
): Promise<ActionResponse<GetPublicProductsResponse, ErrorCode>> => {
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
    eq(product.status, "approved"),
    eq(product.deleted, false),
  ];

  if (organizationId) {
    whereConditions.push(eq(product.organizationId, organizationId));
  }

  // Fetch productos y contar total en paralelo
  const [
    { data: products, error: productsError },
    { data: countResult, error: countError },
  ] = await Promise.all([
    tryCatch(
      db
        .select({
          ...getTableColumns(product),
          organizationName: organization.name,
          sellerName: user.name,
        })
        .from(product)
        .innerJoin(organization, eq(product.organizationId, organization.id))
        .innerJoin(user, eq(product.sellerId, user.id))
        .where(and(...whereConditions))
        .orderBy(desc(product.createdAt))
        .limit(validPageSize)
        .offset(offset)
    ),
    tryCatch(
      db
        .select({ count: count() })
        .from(product)
        .where(and(...whereConditions))
    ),
  ]);

  if (productsError || countError) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch products",
      },
    };
  }

  const total = countResult?.[0]?.count ?? 0;
  const pagination = calculatePagination(validPage, validPageSize, total);

  return {
    data: {
      items: products ?? [],
      pagination,
    },
    error: null,
  };
};