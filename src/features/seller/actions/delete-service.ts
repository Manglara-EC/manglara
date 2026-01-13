"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { service } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CANNOT_DELETE_APPROVED"
  | "INTERNAL_SERVER_ERROR";

export async function deleteService(
  serviceId: string
): Promise<ActionResponse<{ id: string }, ErrorCode>> {
  // 1. Verificar autenticación
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Debes iniciar sesión para eliminar servicios",
      },
    };
  }

  const userId = session.user.id;
  const userRole = session.user.role;

  // 2. Verificar rol de seller o admin
  if (userRole !== "seller" && userRole !== "admin") {
    return {
      data: null,
      error: {
        code: "FORBIDDEN",
        message: "Solo los vendedores pueden eliminar servicios",
      },
    };
  }

  // 3. Obtener el servicio
  const { data: existingService, error: fetchError } = await tryCatch(
    db.query.service.findFirst({
      where: eq(service.id, serviceId),
    })
  );

  if (fetchError || !existingService) {
    return {
      data: null,
      error: {
        code: "NOT_FOUND",
        message: "Servicio no encontrado",
      },
    };
  }

  // 4. Verificar que el usuario es el dueño o admin
  if (existingService.sellerId !== userId && userRole !== "admin") {
    return {
      data: null,
      error: {
        code: "FORBIDDEN",
        message: "No tienes permiso para eliminar este servicio",
      },
    };
  }

  // 5. Solo permitir eliminar servicios pendientes (a menos que sea admin)
  if (existingService.status !== "pending" && userRole !== "admin") {
    return {
      data: null,
      error: {
        code: "CANNOT_DELETE_APPROVED",
        message: "Solo puedes eliminar servicios que estén pendientes de aprobación",
      },
    };
  }

  // 6. Eliminar el servicio (soft delete)
  const { error: deleteError } = await tryCatch(
    db
      .update(service)
      .set({
        deleted: true,
        updatedAt: new Date(),
      })
      .where(eq(service.id, serviceId))
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
