"use server";

import { headers } from "next/headers";
import { eq, and, desc, inArray, getTableColumns } from "drizzle-orm";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import {
  product,
  organization,
  member,
  user,
} from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

import type { PendingProductWithDetails } from "@/features/owner/types";

type ErrorCode = "UNAUTHORIZED" | "FORBIDDEN" | "INTERNAL_SERVER_ERROR";

export const getPendingProducts = async (): Promise<
  ActionResponse<PendingProductWithDetails[], ErrorCode>
> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "You must be logged in",
      },
    };
  }

  // Get organizations where user is owner
  const { data: myOrganizations, error: orgError } = await tryCatch(
    db.query.member.findMany({
      where: and(eq(member.userId, session.user.id), eq(member.role, "owner")),
    }),
  );

  if (orgError) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch organizations",
      },
    };
  }

  const orgIds = myOrganizations?.map((m) => m.organizationId) ?? [];

  if (orgIds.length === 0) {
    return { data: [], error: null };
  }

  // Get pending products
  const { data: products, error: productsError } = await tryCatch(
    db
      .select({
        ...getTableColumns(product),
        sellerName: user.name,
        sellerEmail: user.email,
        organizationName: organization.name,
      })
      .from(product)
      .innerJoin(user, eq(product.sellerId, user.id))
      .innerJoin(organization, eq(product.organizationId, organization.id))
      .where(
        and(
          inArray(product.organizationId, orgIds),
          eq(product.status, "pending"),
          eq(product.deleted, false),
        ),
      )
      .orderBy(desc(product.createdAt)),
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
