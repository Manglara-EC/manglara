"use server";

import { eq, and, getTableColumns } from "drizzle-orm";

import { db } from "@/shared/lib/drizzle/server";
import { product, organization, user } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

import type { PublicProduct } from "@/features/products/types";

type ErrorCode = "NOT_FOUND" | "INTERNAL_SERVER_ERROR";

export const getProductById = async (
  productId: string,
): Promise<ActionResponse<PublicProduct, ErrorCode>> => {
  const { data: prod, error: productError } = await tryCatch(
    db
      .select({
        ...getTableColumns(product),
        organizationName: organization.name,
        sellerName: user.name,
      })
      .from(product)
      .innerJoin(organization, eq(product.organizationId, organization.id))
      .innerJoin(user, eq(product.sellerId, user.id))
      .where(
        and(
          eq(product.id, productId),
          eq(product.status, "approved"),
          eq(product.deleted, false),
        ),
      )
      .limit(1),
  );

  if (productError || !prod || prod.length === 0) {
    return {
      data: null,
      error: {
        code: "NOT_FOUND",
        message: "Product not found",
      },
    };
  }

  return {
    data: prod[0],
    error: null,
  };
};
