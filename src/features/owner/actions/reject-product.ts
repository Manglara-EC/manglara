"use server";

import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { product, request, member } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

import { rejectProductSchema } from "@/features/owner/schemas/reject-product";
import type { RejectProductVariables } from "@/features/owner/types";
import type { Product } from "@/shared/types";

type ErrorCode = 
  | "UNAUTHORIZED" 
  | "FORBIDDEN" 
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "INTERNAL_SERVER_ERROR";

export const rejectProduct = async (
  variables: RejectProductVariables
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

  const validation = rejectProductSchema.safeParse(variables);
  
  if (!validation.success) {
    return {
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.error.message,
      },
    };
  }

  const { data: prod, error: prodError } = await tryCatch(
    db.query.product.findFirst({
      where: eq(product.id, variables.productId),
    })
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

  const { data: membership, error: membershipError } = await tryCatch(
    db.query.member.findFirst({
      where: and(
        eq(member.userId, session.user.id),
        eq(member.organizationId, prod.organizationId),
        eq(member.role, "owner")
      ),
    })
  );

  if (membershipError || !membership) {
    return {
      data: null,
      error: {
        code: "FORBIDDEN",
        message: "You don't have permission to reject this product",
      },
    };
  }

  const { data: updated, error: updateError } = await tryCatch(
    db
      .update(product)
      .set({
        status: "rejected",
        rejectionReason: variables.reason,
        updatedAt: new Date(),
      })
      .where(eq(product.id, variables.productId))
      .returning()
  );

  if (updateError || !updated || updated.length === 0) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to reject product",
      },
    };
  }

  await tryCatch(
    db.insert(request).values({
      id: crypto.randomUUID(),
      userId: prod.sellerId,
      type: "product_rejected",
      message: `Your product "${prod.name}" has been rejected${variables.reason ? `: ${variables.reason}` : ""}`,
      productId: variables.productId,
      serviceId: null,
      referenceType: "product",
      createdAt: new Date(),
    })
  );

  return {
    data: updated[0],
    error: null,
  };
};