"use server";

import { db } from "@/shared/lib/drizzle/server";
import { product } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";
import { getViewer } from "@/shared/lib/authz/server";
import { canInOrganization } from "@/shared/lib/authz/access";

import { createProductSchema } from "@/features/seller/schemas/create-product";
import type { CreateProductVariables } from "@/features/seller/types";
import type { Product } from "@/shared/types";
import { notifyOwnerOfNewItem } from "@/shared/actions/send-item-notification";

type ErrorCode =
  "UNAUTHORIZED" | "FORBIDDEN" | "VALIDATION_ERROR" | "INTERNAL_SERVER_ERROR";

export const createProduct = async (
  variables: CreateProductVariables,
): Promise<ActionResponse<Product, ErrorCode>> => {
  const viewer = await getViewer();

  if (!viewer) {
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
        message: validation.error.issues[0]?.message ?? "Datos inválidos",
      },
    };
  }

  // Solo vendedores (seller/admin/owner) de ESA comuna pueden publicar en ella
  if (
    !canInOrganization(
      viewer.access,
      validation.data.organizationId,
      "item:create",
    )
  ) {
    return {
      data: null,
      error: {
        code: "FORBIDDEN",
        message: "Necesitas ser vendedor de esta comuna para publicar en ella",
      },
    };
  }

  const { data: newProduct, error: productError } = await tryCatch(
    db
      .insert(product)
      .values({
        ...validation.data,
        id: crypto.randomUUID(),
        status: "pending",
        deleted: false,
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        sellerId: viewer.session.user.id,
      })
      .returning(),
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
    organizationId: newProduct[0].organizationId,
    itemName: newProduct[0].name,
    itemId: newProduct[0].id,
    type: "product",
    sellerId: viewer.session.user.id,
  });

  return {
    data: newProduct[0],
    error: null,
  };
};
