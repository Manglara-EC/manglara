"use server";

import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { product, request, member } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

import { createProductSchema } from "@/features/seller/schemas/create-product";
import type { CreateProductVariables } from "@/features/seller/types";
import type { Product } from "@/shared/types";
import { notifyOwnerOfNewItem } from "@/shared/actions/send-item-notification";

type ErrorCode = 
  | "UNAUTHORIZED" 
  | "FORBIDDEN" 
  | "VALIDATION_ERROR"
  | "INTERNAL_SERVER_ERROR";

export const createProduct = async (
  variables: CreateProductVariables
): Promise<ActionResponse<Product, ErrorCode>> => {
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

  const validation = createProductSchema.safeParse(variables);
  
  if (!validation.success) {
    return {
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.error.message,
      },
    };
  }

  // Verificar que el usuario es seller de la organización
  const { data: membership, error: membershipError } = await tryCatch(
    db.query.member.findFirst({
      where: and(
        eq(member.userId, variables.sellerId),
        eq(member.organizationId, variables.organizationId)
      ),
    })
  );

  if (membershipError || !membership) {
    return {
      data: null,
      error: {
        code: "FORBIDDEN",
        message: "No tienes permiso para publicar en esta organización",
      },
    };
  }

  if (membership.role !== "seller" && membership.role !== "owner") {
    return {
      data: null,
      error: {
        code: "FORBIDDEN",
        message: "Necesitas el rol de seller u owner",
      },
    };
  }

  const { data: newProduct, error: productError } = await tryCatch(
    db.insert(product).values({
      id: crypto.randomUUID(),
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...validation.data
    }).returning()
  );

  if (productError || !newProduct || newProduct.length === 0) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al crear el producto 😢",
      },
    };
  }

  await notifyOwnerOfNewItem({
    organizationId: variables.organizationId,
    itemName: newProduct[0].name,
    itemId: newProduct[0].id,
    type: "product", 
  });

  return {
    data: newProduct[0],
    error: null,
  };
};