// src/features/seller/actions/create-service.ts

"use server";

import { db } from "@/shared/lib/drizzle/server";
import { service } from "@/shared/lib/drizzle/schema";
import { getViewer } from "@/shared/lib/authz/server";
import { canInOrganization } from "@/shared/lib/authz/access";
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
  | "VALIDATION_ERROR"
  | "SERVICE_TYPE_VALIDATION_ERROR"
  | "INTERNAL_SERVER_ERROR";

export const createService = async (
  variables: CreateServiceVariables,
): Promise<ActionResponse<Service, ErrorCode>> => {
  // 1. Verificar autenticación
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
  const session = viewer.session;

  // 2. El permiso de venta depende del rol en la comuna (se verifica en el paso 5)

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

  // 5. Solo vendedores (seller/admin/owner) de ESA comuna pueden publicar en ella
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
    latitude: validation.data.latitude ?? null,
    longitude: validation.data.longitude ?? null,
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
    organizationId: newService[0].organizationId,
    itemName: newService[0].name,
    itemId: newService[0].id,
    type: "service",
    sellerId: session.user.id,
  });

  return {
    data: newService[0],
    error: null,
  };
};
