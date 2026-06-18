"use server";

import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { service, organization, member } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import { createServiceSchema, validateServiceByType } from "@/features/seller/schemas/create-service";
import type { UpdateServiceVariables, ServiceWithOrg } from "@/features/seller/types";

export async function updateService(
  serviceId: string,
  data: UpdateServiceVariables
): Promise<{ data?: ServiceWithOrg; error?: { code: string; message: string } }> {
  try {
    // 1. Verificar autenticación
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return { error: { code: "UNAUTHENTICATED", message: "Debes iniciar sesión para actualizar servicios" } };
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    // 2. Verificar rol de seller o admin
    if (userRole !== "seller" && userRole !== "admin") {
      return { error: { code: "FORBIDDEN", message: "Solo los vendedores pueden actualizar servicios" } };
    }

    // 3. Verificar que el servicio existe y pertenece al usuario
    const existingService = await db
      .select({
        id: service.id,
        organizationId: service.organizationId,
        sellerId: service.sellerId,
      })
      .from(service)
      .where(eq(service.id, serviceId))
      .limit(1);

    if (existingService.length === 0) {
      return { error: { code: "NOT_FOUND", message: "Servicio no encontrado" } };
    }

    const serviceData = existingService[0];

    // 4. Verificar que el usuario creó este servicio o es admin
    if (serviceData.sellerId !== userId && userRole !== "admin") {
      return { error: { code: "FORBIDDEN", message: "No tienes permiso para editar este servicio" } };
    }

    // 5. Si se está cambiando la organización, verificar membresía
    if (data.organizationId && data.organizationId !== serviceData.organizationId) {
      // Verificar que la organización existe y tiene rol de vendedor
      const org = await db
        .select({ id: organization.id, slug: organization.slug })
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
    const validation = createServiceSchema.safeParse(data);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return {
        error: {
          code: "VALIDATION_ERROR",
          message: firstError?.message || "Datos inválidos",
        },
      };
    }

    const validatedData = validation.data;

    // 7. Validar campos específicos según tipo de servicio
    const typeErrors = validateServiceByType(validatedData);
    if (typeErrors.length > 0) {
      return {
        error: {
          code: "VALIDATION_ERROR",
          message: typeErrors.join(". "),
        },
      };
    }

    // 8. Actualizar servicio en la base de datos
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
        serviceConfig: validatedData.serviceConfig,
        availabilityRules: validatedData.availabilityRules,
        cancellationPolicy: validatedData.cancellationPolicy,
        status: "pending", // Vuelve a pendiente para revisión
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
        updatedAt: new Date(),
      })
      .where(eq(service.id, serviceId))
      .returning();

    // 9. Obtener nombre de la organización
    const orgData = await db
      .select({ name: organization.name })
      .from(organization)
      .where(eq(organization.id, updatedService.organizationId))
      .limit(1);

    const result: ServiceWithOrg = {
      ...updatedService,
      organizationName: orgData[0]?.name || "Organización desconocida",
      price: Number(updatedService.price),
    };

    return { data: result };
  } catch (error) {
    console.error("Error updating service:", error);
    return { error: { code: "INTERNAL_ERROR", message: "Error interno al actualizar el servicio" } };
  }
}
