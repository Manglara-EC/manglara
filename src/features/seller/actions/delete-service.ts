"use server";

import { eq } from "drizzle-orm";

import { db } from "@/shared/lib/drizzle/server";
import { getViewer } from "@/shared/lib/authz/server";
import {
  canDeleteItem,
  canInOrganization,
  isOwnItem,
} from "@/shared/lib/authz/access";
import { service } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";
import { hasSalesOrBookings } from "@/features/seller/lib/item-history";

type ErrorCode =
  "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "INTERNAL_SERVER_ERROR";

export async function deleteService(
  serviceId: string,
): Promise<ActionResponse<{ id: string }, ErrorCode>> {
  // 1. Verificar autenticación
  const viewer = await getViewer();

  if (!viewer) {
    return {
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Debes iniciar sesión para eliminar servicios",
      },
    };
  }

  // 2. Obtener el servicio
  const { data: existingService, error: fetchError } = await tryCatch(
    db.query.service.findFirst({
      where: eq(service.id, serviceId),
    }),
  );

  if (fetchError || !existingService || existingService.deleted) {
    return {
      data: null,
      error: {
        code: "NOT_FOUND",
        message: "Servicio no encontrado",
      },
    };
  }

  // 3. Vendedor dueño (pendiente o rechazado) o administración de la comuna
  if (!canDeleteItem(viewer.access, existingService)) {
    return {
      data: null,
      error: {
        code: "FORBIDDEN",
        message: !isOwnItem(viewer.access, existingService)
          ? "No tienes permiso para eliminar este servicio"
          : canInOrganization(
                viewer.access,
                existingService.organizationId,
                "item:delete_own",
              )
            ? "Solo puedes eliminar servicios pendientes o rechazados"
            : "Ya no tienes rol de venta en la comuna de este servicio",
      },
    };
  }

  // Un vendedor no retira por su cuenta un servicio con ventas o reservas
  // (por ejemplo, editándolo para que vuelva a pendiente): lo hace la
  // administración de la comuna.
  if (
    !canInOrganization(
      viewer.access,
      existingService.organizationId,
      "item:delete_any",
    ) &&
    (await hasSalesOrBookings("service", existingService.id))
  ) {
    return {
      data: null,
      error: {
        code: "FORBIDDEN",
        message:
          "Este servicio tiene ventas o reservas: pide a un administrador de la comuna que lo retire",
      },
    };
  }

  // 4. Eliminar el servicio (soft delete)
  const { error: deleteError } = await tryCatch(
    db
      .update(service)
      .set({
        deleted: true,
        updatedAt: new Date(),
      })
      .where(eq(service.id, serviceId)),
  );

  if (deleteError) {
    console.error("Error al eliminar servicio:", deleteError);
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al eliminar el servicio",
      },
    };
  }

  return {
    data: { id: serviceId },
    error: null,
  };
}
