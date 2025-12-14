"use server";

import { eq, and, desc, getTableColumns, ilike, gte, lte } from "drizzle-orm";

import { db } from "@/shared/lib/drizzle/server";
import { product, service, organization, user } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

import type { PublicItem, ItemSearchParams } from "@/features/items/types";

type ErrorCode = "INTERNAL_SERVER_ERROR";

export const getVisibleItems = async (
  params?: ItemSearchParams
): Promise<ActionResponse<PublicItem[], ErrorCode>> => {
  const {
    query,
    organizationId,
    minPrice,
    maxPrice,
    itemType,
    limit = 50,
    offset = 0,
  } = params ?? {};

  const items: PublicItem[] = [];

  // Fetch products if itemType is not specified or is "product"
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

    const { data: products, error: productsError } = await tryCatch(
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
        .limit(limit)
        .offset(offset)
    );

    if (productsError) {
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
        }))
      );
    }
  }

  // Fetch services if itemType is not specified or is "service"
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
        .where(and(...serviceConditions))
        .orderBy(desc(service.createdAt))
        .limit(limit)
        .offset(offset)
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

    if (services) {
      items.push(
        ...services.map((s) => ({
          ...s,
          type: "service" as const,
        }))
      );
    }
  }

  // Sort all items by createdAt (most recent first)
  items.sort((a, b) => {
    const aDate = new Date(a.createdAt).getTime();
    const bDate = new Date(b.createdAt).getTime();
    return bDate - aDate;
  });

  // Apply limit and offset to the combined results
  const paginatedItems = items.slice(offset, offset + limit);

  return {
    data: paginatedItems,
    error: null,
  };
};

