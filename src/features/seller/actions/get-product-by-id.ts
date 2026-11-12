"use server";

import { eq } from "drizzle-orm";

import { getViewer } from "@/shared/lib/authz/server";
import { db } from "@/shared/lib/drizzle/server";
import { product, organization } from "@/shared/lib/drizzle/schema";
import type { ProductWithOrg } from "@/features/seller/types";

export async function getProductById(productId: string): Promise<{
  data?: ProductWithOrg;
  error?: { code: string; message: string };
}> {
  try {
    // 1. Verificar autenticación
    const viewer = await getViewer();

    if (!viewer) {
      return {
        error: { code: "UNAUTHENTICATED", message: "Debes iniciar sesión" },
      };
    }

    const userId = viewer.session.user.id;

    // 2. Obtener producto con nombre de organización
    const productData = await db
      .select({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        images: product.images,
        isReservable: product.isReservable,
        organizationId: product.organizationId,
        sellerId: product.sellerId,
        status: product.status,
        deleted: product.deleted,
        approvedBy: product.approvedBy,
        approvedAt: product.approvedAt,
        rejectionReason: product.rejectionReason,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        location: product.location,
        latitude: product.latitude,
        longitude: product.longitude,
        organizationName: organization.name,
      })
      .from(product)
      .innerJoin(organization, eq(product.organizationId, organization.id))
      .where(eq(product.id, productId))
      .limit(1);

    if (productData.length === 0) {
      return {
        error: { code: "NOT_FOUND", message: "Producto no encontrado" },
      };
    }

    const foundProduct = productData[0];

    // 3. El panel del vendedor solo muestra ítems propios. Los administradores
    // de la comuna y el admin global revisan ítems ajenos en /review.
    if (foundProduct.sellerId !== userId || foundProduct.deleted) {
      return {
        error: {
          code: "FORBIDDEN",
          message: "No tienes permiso para ver este producto",
        },
      };
    }

    const result: ProductWithOrg = {
      ...foundProduct,
      price: foundProduct.price,
      images: foundProduct.images ?? null,
    };

    return { data: result };
  } catch (error) {
    console.error("Error getting product:", error);
    return {
      error: {
        code: "INTERNAL_ERROR",
        message: "Error interno al obtener el producto",
      },
    };
  }
}
