"use server";

import { eq } from "drizzle-orm";

import { db } from "@/shared/lib/drizzle/server";
import { product, organization } from "@/shared/lib/drizzle/schema";
import { getViewer } from "@/shared/lib/authz/server";
import { canEditItem, canInOrganization } from "@/shared/lib/authz/access";
import { notifyOwnerOfNewItem } from "@/shared/actions/send-item-notification";
import { deleteReplacedImages } from "@/shared/lib/storage/delete-replaced-images";
import { updateProductSchema } from "@/features/seller/schemas/update-product";
import type {
  UpdateProductVariables,
  ProductWithOrg,
} from "@/features/seller/types";

export async function updateProduct(
  productId: string,
  data: UpdateProductVariables,
): Promise<{
  data?: ProductWithOrg;
  error?: { code: string; message: string };
}> {
  try {
    // 1. Verificar autenticación
    const viewer = await getViewer();

    if (!viewer) {
      return {
        error: {
          code: "UNAUTHENTICATED",
          message: "Debes iniciar sesión para actualizar productos",
        },
      };
    }

    // 2. Verificar que el producto existe
    const [existingProduct] = await db
      .select({
        id: product.id,
        organizationId: product.organizationId,
        sellerId: product.sellerId,
        status: product.status,
        deleted: product.deleted,
        images: product.images,
      })
      .from(product)
      .where(eq(product.id, productId))
      .limit(1);

    if (!existingProduct || existingProduct.deleted) {
      return {
        error: { code: "NOT_FOUND", message: "Producto no encontrado" },
      };
    }

    // 3. Solo el vendedor dueño, con rol de venta vigente en la comuna
    if (!canEditItem(viewer.access, existingProduct)) {
      return {
        error: {
          code: "FORBIDDEN",
          message: "No tienes permiso para editar este producto",
        },
      };
    }

    // 4. Validar datos con Zod
    const validation = updateProductSchema.safeParse(data);

    if (!validation.success) {
      return {
        error: {
          code: "VALIDATION_ERROR",
          message: validation.error.issues[0]?.message ?? "Datos inválidos",
        },
      };
    }

    const validatedData = validation.data;

    // 5. Si cambia de comuna, debe poder vender también en la nueva
    if (
      validatedData.organizationId !== existingProduct.organizationId &&
      !canInOrganization(
        viewer.access,
        validatedData.organizationId,
        "item:create",
      )
    ) {
      return {
        error: {
          code: "FORBIDDEN",
          message:
            "Necesitas ser vendedor de esa comuna para mover el producto",
        },
      };
    }

    // 6. Actualizar producto en la base de datos
    // Al editar, el producto vuelve a estado "pending" para revisión
    const [updatedProduct] = await db
      .update(product)
      .set({
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        stock: validatedData.stock,
        images: validatedData.images,
        location: validatedData.location,
        latitude:
          validatedData.latitude !== undefined
            ? validatedData.latitude.toString()
            : null,
        longitude:
          validatedData.longitude !== undefined
            ? validatedData.longitude.toString()
            : null,
        organizationId: validatedData.organizationId,
        isReservable: validatedData.isReservable,
        status: "pending", // Vuelve a pendiente para revisión
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
        updatedAt: new Date(),
      })
      .where(eq(product.id, productId))
      .returning();

    // 7. Liberar del almacenamiento las imágenes que se quitaron
    if (validatedData.images) {
      await deleteReplacedImages({
        itemId: productId,
        previous: existingProduct.images,
        next: validatedData.images,
      });
    }

    // 8. Avisar a los administradores de la comuna que debe revisarse de nuevo
    await notifyOwnerOfNewItem({
      organizationId: updatedProduct.organizationId,
      itemName: updatedProduct.name,
      itemId: updatedProduct.id,
      type: "product",
      sellerId: viewer.session.user.id,
      reason: "updated",
    });

    // 9. Obtener nombre de la organización
    const orgData = await db
      .select({ name: organization.name })
      .from(organization)
      .where(eq(organization.id, updatedProduct.organizationId))
      .limit(1);

    const result: ProductWithOrg = {
      ...updatedProduct,
      organizationName: orgData[0]?.name || "Organización desconocida",
    };

    return { data: result };
  } catch (error) {
    console.error("Error updating product:", error);
    return {
      error: {
        code: "INTERNAL_ERROR",
        message: "Error interno al actualizar el producto",
      },
    };
  }
}
