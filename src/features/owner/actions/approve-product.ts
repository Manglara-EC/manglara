"use server";

import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { product, request, member } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

import { approveProductSchema } from "@/features/owner/schemas/approve-product";
import type { ApproveProductVariables } from "@/features/owner/types";
import type { Product } from "@/shared/types";
import { markRequestAsReadByItem } from "@/shared/actions/mark-notification-as-read";

type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "INTERNAL_SERVER_ERROR";

export const approveProduct = async (
  variables: ApproveProductVariables,
): Promise<ActionResponse<Product, ErrorCode>> => {
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

  const validation = approveProductSchema.safeParse(variables);

  if (!validation.success) {
    return {
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.error.message,
      },
    };
  }

  // Get product
  const { data: prod, error: prodError } = await tryCatch(
    db.query.product.findFirst({
      where: eq(product.id, variables.productId),
    }),
  );

  if (prodError || !prod) {
    return {
      data: null,
      error: {
        code: "NOT_FOUND",
        message: "Product not found",
      },
    };
  }

  // Verify user is owner of the organization
  const { data: membership, error: membershipError } = await tryCatch(
    db.query.member.findFirst({
      where: and(
        eq(member.userId, session.user.id),
        eq(member.organizationId, prod.organizationId),
        eq(member.role, "owner"),
      ),
    }),
  );

  if (membershipError || !membership) {
    return {
      data: null,
      error: {
        code: "FORBIDDEN",
        message: "You don't have permission to approve this product",
      },
    };
  }

  // Approve product
  const { data: updated, error: updateError } = await tryCatch(
    db
      .update(product)
      .set({
        status: "approved",
        approvedBy: session.user.id,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(product.id, variables.productId))
      .returning(),
  );

  if (updateError || !updated || updated.length === 0) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to approve product",
      },
    };
  }

  await markRequestAsReadByItem({
    userId: session.user.id,
    itemId: variables.productId,
    type: "product",
  });

  await tryCatch(
    db.insert(request).values({
      id: crypto.randomUUID(),
      userId: prod.sellerId,
      type: "product_approved",
      message: `Your product "${prod.name}" has been approved`,
      productId: variables.productId,
      serviceId: null,
      referenceType: "product",
      createdAt: new Date(),
    }),
  );
  return {
    data: updated[0],
    error: null,
  };
};
