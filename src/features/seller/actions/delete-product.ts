"use server";

import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { product, member } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";
import type { Product } from "@/shared/types";

type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INTERNAL_SERVER_ERROR";

export const deleteProduct = async (
  productId: string,
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

  // Obtener el producto
  const { data: existingProduct, error: productError } = await tryCatch(
    db.query.product.findFirst({
      where: eq(product.id, productId),
    }),
  );

  if (productError || !existingProduct) {
    return {
      data: null,
      error: {
        code: "NOT_FOUND",
        message: "Producto no encontrado",
      },
    };
  }

  // Verificar que el usuario es el seller o es miembro seller/owner de la org
  const isProductOwner = existingProduct.sellerId === session.user.id;
  const isAdmin = session.user.role === "admin";

  if (!isProductOwner && !isAdmin) {
    // Verificar si es owner de la organización
    const { data: membership } = await tryCatch(
      db.query.member.findFirst({
        where: and(
          eq(member.userId, session.user.id),
          eq(member.organizationId, existingProduct.organizationId),
          eq(member.role, "owner"),
        ),
      }),
    );

    if (!membership) {
      return {
        data: null,
        error: {
          code: "FORBIDDEN",
          message: "No tienes permiso para eliminar este producto",
        },
      };
    }
  }

  // Soft delete
  const { data: deletedProduct, error: deleteError } = await tryCatch(
    db
      .update(product)
      .set({
        deleted: true,
        updatedAt: new Date(),
      })
      .where(eq(product.id, productId))
      .returning(),
  );

  if (deleteError || !deletedProduct || deletedProduct.length === 0) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al eliminar el producto",
      },
    };
  }

  return {
    data: deletedProduct[0],
    error: null,
  };
};
