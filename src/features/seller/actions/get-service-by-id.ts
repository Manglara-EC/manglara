"use server";

import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { service, organization, member } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ServiceWithOrg } from "@/features/seller/types";

export async function getServiceById(
  serviceId: string,
): Promise<{
  data?: ServiceWithOrg;
  error?: { code: string; message: string };
}> {
  try {
    // 1. Verificar autenticación
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return {
        error: { code: "UNAUTHENTICATED", message: "Debes iniciar sesión" },
      };
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    // 2. Obtener servicio con nombre de organización
    const serviceData = await db
      .select({
        id: service.id,
        name: service.name,
        description: service.description,
        organizationId: service.organizationId,
        price: service.price,
        priceUnit: service.priceUnit,
        serviceType: service.serviceType,
        durationMinutes: service.durationMinutes,
        maxCapacity: service.maxCapacity,
        location: service.location,
        serviceConfig: service.serviceConfig,
        availabilityRules: service.availabilityRules,
        cancellationPolicy: service.cancellationPolicy,
        cancellationWindowHours: service.cancellationWindowHours,
        images: service.images,
        sellerId: service.sellerId,
        status: service.status,
        deleted: service.deleted,
        approvedBy: service.approvedBy,
        approvedAt: service.approvedAt,
        rejectionReason: service.rejectionReason,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
        organizationName: organization.name,
      })
      .from(service)
      .innerJoin(organization, eq(service.organizationId, organization.id))
      .where(eq(service.id, serviceId))
      .limit(1);

    if (serviceData.length === 0) {
      return {
        error: { code: "NOT_FOUND", message: "Servicio no encontrado" },
      };
    }

    const foundService = serviceData[0];

    // 3. Verificar que el usuario puede ver este servicio
    // Admin puede ver todos, seller solo los suyos o de sus organizaciones
    if (userRole !== "admin") {
      // Verificar si es el creador (sellerId)
      if (foundService.sellerId !== userId) {
        // Verificar si es miembro de la organización
        const memberRecord = await db
          .select({ role: member.role })
          .from(member)
          .where(
            and(
              eq(member.organizationId, foundService.organizationId),
              eq(member.userId, userId),
            ),
          )
          .limit(1);

        if (memberRecord.length === 0) {
          return {
            error: {
              code: "FORBIDDEN",
              message: "No tienes permiso para ver este servicio",
            },
          };
        }
      }
    }

    const result: ServiceWithOrg = {
      ...foundService,
      price: String(foundService.price),
      serviceConfig: foundService.serviceConfig ?? null,
      availabilityRules: foundService.availabilityRules ?? null,
      images: foundService.images ?? null,
    };

    return { data: result };
  } catch (error) {
    console.error("Error getting service:", error);
    return {
      error: {
        code: "INTERNAL_ERROR",
        message: "Error interno al obtener el servicio",
      },
    };
  }
}
