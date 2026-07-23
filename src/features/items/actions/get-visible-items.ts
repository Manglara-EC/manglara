"use server";

import {
  eq,
  and,
  desc,
  getTableColumns,
  ilike,
  gte,
  lte,
  count,
} from "drizzle-orm";

import { db } from "@/shared/lib/drizzle/server";
import {
  product,
  service,
  organization,
  user,
} from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";
import {
  paginationParamsSchema,
  calculateOffset,
  calculatePagination,
  type PaginationResponse,
} from "@/shared/schemas/pagination";

import type { PublicItem, ItemSearchParams } from "@/features/items/types";

type ErrorCode = "INTERNAL_SERVER_ERROR" | "INVALID_PARAMS";

export interface GetVisibleItemsResponse {
  items: PublicItem[];
  pagination: PaginationResponse;
}

export const getVisibleItems = async (
  params?: ItemSearchParams,
): Promise<ActionResponse<GetVisibleItemsResponse, ErrorCode>> => {
  const {
    query,
    organizationId,
    minPrice,
    maxPrice,
    itemType,
    page = 1,
    pageSize = 50,
  } = params ?? {};

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

  const items: PublicItem[] = [];
  let totalCount = 0;

  // Fetch products si itemType no está especificado o es "product"
  if (!itemType || itemType === "product") {
    const productConditions = [
      eq(product.status, "approved"),
      eq(product.deleted, false),
    ];

    if (query) {
      productConditions.push(ilike(product.name, `%${query}%`));
    }

    if (organizationId) {
      productConditions.push(eq(product.organizationId, organizationId));
    }

    if (minPrice !== undefined) {
      productConditions.push(gte(product.price, minPrice.toString()));
    }

    if (maxPrice !== undefined) {
      productConditions.push(lte(product.price, maxPrice.toString()));
    }

    const [
      { data: products, error: productsError },
      { data: productsCountResult, error: productsCountError },
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
          .where(and(...productConditions))
          .orderBy(desc(product.createdAt))
          .limit(validPageSize)
          .offset(offset),
      ),
      tryCatch(
        db
          .select({ count: count() })
          .from(product)
          .where(and(...productConditions)),
      ),
    ]);

    if (productsError || productsCountError) {
      return {
        data: null,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch products",
        },
      };
    }

    if (products) {
      items.push(
        ...products.map((p) => ({
          ...p,
          type: "product" as const,
        })),
      );
    }

    totalCount += productsCountResult?.[0]?.count ?? 0;
  }

  // Fetch services si itemType no está especificado o es "service"
  if (!itemType || itemType === "service") {
    const serviceConditions = [
      eq(service.status, "approved"),
      eq(service.deleted, false),
    ];

    if (query) {
      serviceConditions.push(ilike(service.name, `%${query}%`));
    }

    if (organizationId) {
      serviceConditions.push(eq(service.organizationId, organizationId));
    }

    if (minPrice !== undefined) {
      serviceConditions.push(gte(service.price, minPrice.toString()));
    }

    if (maxPrice !== undefined) {
      serviceConditions.push(lte(service.price, maxPrice.toString()));
    }

    const [
      { data: services, error: servicesError },
      { data: servicesCountResult, error: servicesCountError },
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
          .where(and(...serviceConditions))
          .orderBy(desc(service.createdAt))
          .limit(validPageSize)
          .offset(offset),
      ),
      tryCatch(
        db
          .select({ count: count() })
          .from(service)
          .where(and(...serviceConditions)),
      ),
    ]);

    if (servicesError || servicesCountError) {
      return {
        data: null,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch services",
        },
      };
    }

    if (services) {
      items.push(
        ...services.map((s) => ({
          ...s,
          type: "service" as const,
        })),
      );
    }

    totalCount += servicesCountResult?.[0]?.count ?? 0;
  }

  // Ordenar todos los items por createdAt (más recientes primero)
  items.sort((a, b) => {
    const aDate = new Date(a.createdAt).getTime();
    const bDate = new Date(b.createdAt).getTime();
    return bDate - aDate;
  });

  const pagination = calculatePagination(validPage, validPageSize, totalCount);

  return {
    data: {
      items,
      pagination,
    },
    error: null,
  };
};
