"use server";

import { eq } from "drizzle-orm";

import { db } from "@/shared/lib/drizzle/server";
import { service, organization } from "@/shared/lib/drizzle/schema";
import { getViewer } from "@/shared/lib/authz/server";
import { canEditItem, canInOrganization } from "@/shared/lib/authz/access";
import { notifyOwnerOfNewItem } from "@/shared/actions/send-item-notification";
import { deleteReplacedImages } from "@/shared/lib/storage/delete-replaced-images";
import {
  createServiceSchema,
  validateServiceByType,
} from "@/features/seller/schemas/create-service";
import type {
  UpdateServiceVariables,
  ServiceWithOrg,
} from "@/features/seller/types";

export async function updateService(
  serviceId: string,
  data: UpdateServiceVariables,
): Promise<{
  data?: ServiceWithOrg;
  error?: { code: string; message: string };
}> {
  try {
    // 1. Verificar autenticación
    const viewer = await getViewer();

    if (!viewer) {
      return {
        error: {
          code: "UNAUTHENTICATED",
          message: "Debes iniciar sesión para actualizar servicios",
        },
      };
    }

    // 2. Verificar que el servicio existe
    const [serviceData] = await db
      .select({
        id: service.id,
        organizationId: service.organizationId,
        sellerId: service.sellerId,
        status: service.status,
        deleted: service.deleted,
        images: service.images,
      })
      .from(service)
      .where(eq(service.id, serviceId))
      .limit(1);

    if (!serviceData || serviceData.deleted) {
      return {
        error: { code: "NOT_FOUND", message: "Servicio no encontrado" },
      };
    }

    // 3. Solo el vendedor dueño, con rol de venta vigente en la comuna
    if (!canEditItem(viewer.access, serviceData)) {
      return {
        error: {
          code: "FORBIDDEN",
          message: "No tienes permiso para editar este servicio",
        },
      };
    }

    // 4. Validar datos con Zod
    const validation = createServiceSchema.safeParse(data);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return {
        error: {
          code: "VALIDATION_ERROR",
          message: firstError?.message || "Datos inválidos",
        },
      };
    }

    const validatedData = validation.data;

    // 5. Si cambia de comuna, debe poder vender también en la nueva
    if (
      validatedData.organizationId !== serviceData.organizationId &&
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
            "Necesitas ser vendedor de esa comuna para mover el servicio",
        },
      };
    }

    // 6. Validar campos específicos según tipo de servicio
    const typeErrors = validateServiceByType(validatedData);
    if (typeErrors.length > 0) {
      return {
        error: {
          code: "VALIDATION_ERROR",
          message: typeErrors.join(". "),
        },
      };
    }

    // 7. Actualizar servicio en la base de datos
    // Al editar, el servicio vuelve a estado "pending" para revisión del admin
    const [updatedService] = await db
      .update(service)
      .set({
        name: validatedData.name,
        description: validatedData.description,
        organizationId: validatedData.organizationId,
        price: validatedData.price.toString(),
        priceUnit: validatedData.priceUnit,
        serviceType: validatedData.serviceType,
        location: validatedData.location,
        latitude: validatedData.latitude ?? null,
        longitude: validatedData.longitude ?? null,
        maxCapacity: validatedData.maxCapacity,
        cancellationWindowHours: validatedData.cancellationWindowHours,
        serviceConfig: validatedData.serviceConfig,
        availabilityRules: validatedData.availabilityRules,
        cancellationPolicy: validatedData.cancellationPolicy,
        images: validatedData.images ?? null,
        status: "pending", // Vuelve a pendiente para revisión
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
        updatedAt: new Date(),
      })
      .where(eq(service.id, serviceId))
      .returning();

    // 8. Liberar del almacenamiento las imágenes que se quitaron
    if (validatedData.images) {
      await deleteReplacedImages({
        itemId: serviceId,
        previous: serviceData.images,
        next: validatedData.images,
      });
    }

    // 9. Avisar a los administradores de la comuna que debe revisarse de nuevo
    await notifyOwnerOfNewItem({
      organizationId: updatedService.organizationId,
      itemName: updatedService.name,
      itemId: updatedService.id,
      type: "service",
      sellerId: viewer.session.user.id,
      reason: "updated",
    });

    // 10. Obtener nombre de la organización
    const orgData = await db
      .select({ name: organization.name })
      .from(organization)
      .where(eq(organization.id, updatedService.organizationId))
      .limit(1);

    const result: ServiceWithOrg = {
      ...updatedService,
      organizationName: orgData[0]?.name || "Organización desconocida",
      price: String(updatedService.price),
    };

    return { data: result };
  } catch (error) {
    console.error("Error updating service:", error);
    return {
      error: {
        code: "INTERNAL_ERROR",
        message: "Error interno al actualizar el servicio",
      },
    };
  }
}
