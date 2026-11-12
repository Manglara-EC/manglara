"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/shared/lib/drizzle/server";
import { product, service } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import { getViewer } from "@/shared/lib/authz/server";
import { canInOrganization } from "@/shared/lib/authz/access";
import type { ActionResponse } from "@/shared/types";

import { itemRefSchema, type ItemRef } from "@/features/moderation/types";
import { loadItemScope } from "@/features/moderation/lib/item-scope";

type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "INTERNAL_SERVER_ERROR";

/**
 * Borrado lógico de un ítem desde la revisión (moderación).
 * Solo el administrador global o los administradores de la comuna del ítem.
 */
export async function deleteItem(
  input: ItemRef,
): Promise<ActionResponse<{ id: string }, ErrorCode>> {
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

  const validation = itemRefSchema.safeParse(input);

  if (!validation.success) {
    return {
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.error.issues[0]?.message ?? "Datos inválidos",
      },
    };
  }

  const { itemId, itemType } = validation.data;
  const item = await loadItemScope(itemType, itemId);

  if (!item || item.deleted) {
    return {
      data: null,
      error: {
        code: "NOT_FOUND",
        message: "Ítem no encontrado",
      },
    };
  }

  if (
    !canInOrganization(viewer.access, item.organizationId, "item:delete_any")
  ) {
    return {
      data: null,
      error: {
        code: "FORBIDDEN",
        message: "No tienes permiso para eliminar ítems de esta comuna",
      },
    };
  }

  const table = itemType === "product" ? product : service;

  const { error: deleteError } = await tryCatch(
    db
      .update(table)
      .set({
        deleted: true,
        updatedAt: new Date(),
      })
      .where(eq(table.id, itemId)),
  );

  if (deleteError) {
    console.error("Error al eliminar item:", deleteError);
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al eliminar el item",
      },
    };
  }

  revalidatePath("/organizations");

  return {
    data: { id: itemId },
    error: null,
  };
}
