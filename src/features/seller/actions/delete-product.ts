"use server";

import { eq } from "drizzle-orm";

import { db } from "@/shared/lib/drizzle/server";
import { product } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import { getViewer } from "@/shared/lib/authz/server";
import {
  canDeleteItem,
  canInOrganization,
  isOwnItem,
} from "@/shared/lib/authz/access";
import type { ActionResponse } from "@/shared/types";
import { hasSalesOrBookings } from "@/features/seller/lib/item-history";
import type { Product } from "@/shared/types";

type ErrorCode =
  "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "INTERNAL_SERVER_ERROR";

/**
 * Borrado lógico de un producto.
 * - El vendedor dueño: solo si está pendiente o rechazado.
 * - Administradores de la comuna y el administrador global: cualquiera de la comuna.
 */
export const deleteProduct = async (
  productId: string,
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

  const { data: existingProduct, error: productError } = await tryCatch(
    db.query.product.findFirst({
      where: eq(product.id, productId),
    }),
  );

  if (productError || !existingProduct || existingProduct.deleted) {
    return {
      data: null,
      error: {
        code: "NOT_FOUND",
        message: "Producto no encontrado",
      },
    };
  }

  if (!canDeleteItem(viewer.access, existingProduct)) {
    return {
      data: null,
      error: {
        code: "FORBIDDEN",
        message: !isOwnItem(viewer.access, existingProduct)
          ? "No tienes permiso para eliminar este producto"
          : canInOrganization(
                viewer.access,
                existingProduct.organizationId,
                "item:delete_own",
              )
            ? "Solo puedes eliminar productos pendientes o rechazados"
            : "Ya no tienes rol de venta en la comuna de este producto",
      },
    };
  }

  // Un vendedor no retira por su cuenta un producto con ventas o reservas
  // (por ejemplo, editándolo para que vuelva a pendiente): lo hace la
  // administración de la comuna.
  if (
    !canInOrganization(
      viewer.access,
      existingProduct.organizationId,
      "item:delete_any",
    ) &&
    (await hasSalesOrBookings("product", existingProduct.id))
  ) {
    return {
      data: null,
      error: {
        code: "FORBIDDEN",
        message:
          "Este producto tiene ventas o reservas: pide a un administrador de la comuna que lo retire",
      },
    };
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
