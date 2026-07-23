"use server";

import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { product, organization, member } from "@/shared/lib/drizzle/schema";
import { updateProductSchema } from "@/features/seller/schemas/update-product";
import type { UpdateProductVariables, ProductWithOrg } from "@/features/seller/types";

export async function updateProduct(
  productId: string,
  data: UpdateProductVariables
): Promise<{ data?: ProductWithOrg; error?: { code: string; message: string } }> {
  try {
    // 1. Verificar autenticación
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return { error: { code: "UNAUTHENTICATED", message: "Debes iniciar sesión para actualizar productos" } };
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    // 2. Verificar rol de seller o admin
    if (userRole !== "seller" && userRole !== "admin") {
      return { error: { code: "FORBIDDEN", message: "Solo los vendedores pueden actualizar productos" } };
    }

    // 3. Verificar que el producto existe y pertenece al usuario
    const existingProduct = await db
      .select({
        id: product.id,
        organizationId: product.organizationId,
        sellerId: product.sellerId,
      })
      .from(product)
      .where(eq(product.id, productId))
      .limit(1);

    if (existingProduct.length === 0) {
      return { error: { code: "NOT_FOUND", message: "Producto no encontrado" } };
    }

    const productData = existingProduct[0];

    // 4. Verificar que el usuario creó este producto o es admin
    if (productData.sellerId !== userId && userRole !== "admin") {
      return { error: { code: "FORBIDDEN", message: "No tienes permiso para editar este producto" } };
    }

    // 5. Si se está cambiando la organización, verificar membresía
    if (data.organizationId && data.organizationId !== productData.organizationId) {
      // Verificar que la organización existe
      const org = await db
        .select({ id: organization.id })
        .from(organization)
        .where(eq(organization.id, data.organizationId))
        .limit(1);

      if (org.length === 0) {
        return { error: { code: "NOT_FOUND", message: "Organización no encontrada" } };
      }

      // Verificar membresía del usuario en la nueva organización
      const memberRecord = await db
        .select({ role: member.role })
        .from(member)
        .where(and(eq(member.organizationId, data.organizationId), eq(member.userId, userId)))
        .limit(1);

      if (memberRecord.length === 0) {
        return { error: { code: "FORBIDDEN", message: "No eres miembro de esta organización" } };
      }
    }

    // 6. Validar datos con Zod
    const validation = updateProductSchema.safeParse(data);

    if (!validation.success) {
      const firstError = validation.error;
      return {
        error: {
          code: "VALIDATION_ERROR",
          message: firstError?.message || "Datos inválidos",
        },
      };
    }

    const validatedData = validation.data;

    // 7. Actualizar producto en la base de datos
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
          validatedData.latitude !== undefined ? validatedData.latitude.toString() : null,
        longitude:
          validatedData.longitude !== undefined ? validatedData.longitude.toString() : null,
        organizationId: validatedData.organizationId,
        status: "pending", // Vuelve a pendiente para revisión
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
        updatedAt: new Date(),
      })
      .where(eq(product.id, productId))
      .returning();

    // 8. Obtener nombre de la organización
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
    return { error: { code: "INTERNAL_ERROR", message: "Error interno al actualizar el producto" } };
  }
}
