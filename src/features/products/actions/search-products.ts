"use server";

import { eq, and, desc, gte, lte, ilike, getTableColumns } from "drizzle-orm";

import { db } from "@/shared/lib/drizzle/server";
import { product, organization, user } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

import type { PublicProduct, ProductSearchParams } from "@/features/products/types";

type ErrorCode = "INTERNAL_SERVER_ERROR";

export const searchProducts = async (
  params: ProductSearchParams
): Promise<ActionResponse<PublicProduct[], ErrorCode>> => {
  const {
    query,
    organizationId,
    minPrice,
    maxPrice,
    limit = 50,
    offset = 0,
  } = params;

  const whereConditions = [
    eq(product.status, "approved"),
    eq(product.deleted, false),
  ];

  if (query) {
    whereConditions.push(ilike(product.name, `%${query}%`));
  }

  if (organizationId) {
    whereConditions.push(eq(product.organizationId, organizationId));
  }

  if (minPrice !== undefined) {
    whereConditions.push(gte(product.price, minPrice.toString()));
  }

  if (maxPrice !== undefined) {
    whereConditions.push(lte(product.price, maxPrice.toString()));
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
      .where(and(...whereConditions))
      .orderBy(desc(product.createdAt))
      .limit(limit)
      .offset(offset)
  );

  if (productsError) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to search products",
      },
    };
  }

  return {
    data: products ?? [],
    error: null,
  };
};