// src/features/seller/actions/create-service.ts

"use server";

import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { service, member } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";
import type { Service } from "@/shared/types";

import {
  createServiceSchema,
  validateServiceByType,
} from "@/features/seller/schemas/create-service";
import type { CreateServiceVariables } from "@/features/seller/types";
import { notifyOwnerOfNewItem } from "@/shared/actions/send-item-notification";

type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_SELLER"
  | "VALIDATION_ERROR"
  | "SERVICE_TYPE_VALIDATION_ERROR"
  | "INTERNAL_SERVER_ERROR";

export const createService = async (
  variables: CreateServiceVariables,
): Promise<ActionResponse<Service, ErrorCode>> => {
  // 1. Verificar autenticación
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

  // 2. Verificar que el usuario es seller en el sistema
  if (session.user.role !== "seller" && session.user.role !== "admin") {
    return {
      data: null,
      error: {
        code: "NOT_SELLER",
        message: "Necesitas ser vendedor para crear servicios",
      },
    };
  }

  // 3. Validar datos con Zod
  const validation = createServiceSchema.safeParse(variables);

  if (!validation.success) {
    return {
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.error.issues
          .map((issue) => issue.message)
          .join(", "),
      },
    };
  }

  // 4. Validaciones específicas por tipo de servicio
  const typeErrors = validateServiceByType(validation.data);
  if (typeErrors.length > 0) {
    return {
      data: null,
      error: {
        code: "SERVICE_TYPE_VALIDATION_ERROR",
        message: typeErrors.join(", "),
      },
    };
  }

  // 5. Verificar membresía en la organización
  const { data: membership, error: membershipError } = await tryCatch(
    db.query.member.findFirst({
      where: and(
        eq(member.userId, session.user.id),
        eq(member.organizationId, variables.organizationId),
      ),
    }),
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

  // 6. Preparar datos para inserción
  const serviceData = {
    id: crypto.randomUUID(),
    name: validation.data.name,
    description: validation.data.description ?? null,
    serviceType: validation.data.serviceType,
    price: validation.data.price,
    priceUnit: validation.data.priceUnit,
    durationMinutes: validation.data.durationMinutes ?? null,
    maxCapacity: validation.data.maxCapacity,
    location: validation.data.location ?? null,
    serviceConfig: validation.data.serviceConfig ?? null,
    availabilityRules: validation.data.availabilityRules ?? null,
    cancellationPolicy: validation.data.cancellationPolicy,
    cancellationWindowHours: validation.data.cancellationWindowHours,
    images: validation.data.images ?? null,
    sellerId: session.user.id,
    organizationId: validation.data.organizationId,
    status: "pending",
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // 7. Insertar en base de datos
  const { data: newService, error: serviceError } = await tryCatch(
    db.insert(service).values(serviceData).returning(),
  );

  if (serviceError || !newService || newService.length === 0) {
    console.error("Error creating service:", serviceError);
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al crear el servicio 😢",
      },
    };
  }

  // 8. Notificar al owner de la organización
  await notifyOwnerOfNewItem({
    organizationId: variables.organizationId,
    itemName: newService[0].name,
    itemId: newService[0].id,
    type: "service",
  });

  return {
    data: newService[0],
    error: null,
  };
};
