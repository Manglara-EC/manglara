"use server";

import { eq, and, desc, getTableColumns } from "drizzle-orm";

import { db } from "@/shared/lib/drizzle/server";
import { product, organization, user } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

import type { PublicProduct } from "@/features/products/types";

type ErrorCode = "INTERNAL_SERVER_ERROR";

export const getPublicProducts = async (
  organizationId?: string
): Promise<ActionResponse<PublicProduct[], ErrorCode>> => {
  const whereConditions = [
    eq(product.status, "approved"),
    eq(product.deleted, false),
  ];

  if (organizationId) {
    whereConditions.push(eq(product.organizationId, organizationId));
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
      .limit(50)
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

  return {
    data: products ?? [],
    error: null,
  };
};