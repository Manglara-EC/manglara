// src/features/seller/actions/get-my-products.ts

"use server";

import { headers } from "next/headers";
import { eq, and, desc, getTableColumns } from "drizzle-orm";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { product, organization } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

import type { ProductWithOrg } from "@/features/seller/types";

type ErrorCode = "UNAUTHORIZED" | "INTERNAL_SERVER_ERROR";

export const getMyProducts = async (): Promise <
  ActionResponse<ProductWithOrg[], ErrorCode>
> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Debes iniciar sesión",
      },
    };
  }

  const { data: products, error: productsError } = await tryCatch(
    db
      .select({
        ...getTableColumns(product),
        organizationName: organization.name,
      })
      .from(product)
      .innerJoin(organization, eq(product.organizationId, organization.id))
      .where(
        and(
          eq(product.sellerId, session.user.id),
          eq(product.deleted, false)
        )
      )
      .orderBy(desc(product.createdAt))
  );

  if (productsError) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al obtener productos 😢",
      },
    };
  }

  return {
    data: products ?? [],
    error: null,
  };
};