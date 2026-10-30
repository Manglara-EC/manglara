"use server";

import { revalidatePath } from "next/cache";

import { tryCatch } from "@/shared/utils/try-catch";
import { getViewer } from "@/shared/lib/authz/server";
import { canModerateItem, isOwnItem } from "@/shared/lib/authz/access";
import type { ActionResponse } from "@/shared/types";

import {
  rejectItemSchema,
  type RejectItemInput,
} from "@/features/moderation/types";
import {
  applyReviewDecision,
  loadItemScope,
  markReviewRequestsAsRead,
  notifySellerOfReview,
} from "@/features/moderation/lib/item-scope";

type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "INTERNAL_SERVER_ERROR";

/**
 * Rechaza un producto o servicio indicando la razón.
 * Mismas reglas que aprobar: admin global o administradores de la comuna,
 * nunca sobre ítems propios.
 */
export const rejectItem = async (
  input: RejectItemInput,
): Promise<ActionResponse<{ success: boolean }, ErrorCode>> => {
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

  const validation = rejectItemSchema.safeParse(input);

  if (!validation.success) {
    return {
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.error.issues[0]?.message ?? "Datos inválidos",
      },
    };
  }

  const { itemId, itemType, reason, expectedUpdatedAt } = validation.data;
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

  if (!canModerateItem(viewer.access, item)) {
    return {
      data: null,
      error: {
        code: "FORBIDDEN",
        message: isOwnItem(viewer.access, item)
          ? "No puedes rechazar tus propios ítems"
          : "No tienes permiso para rechazar ítems de esta comuna",
      },
    };
  }

  const { data: outcome, error } = await tryCatch(
    applyReviewDecision({
      itemType,
      item,
      expectedUpdatedAt,
      values: {
        status: "rejected",
        approvedBy: viewer.session.user.id,
        rejectionReason: reason,
      },
    }),
  );

  if (error || !outcome) {
    console.error(`Error moderating ${itemType}:`, error);
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: `Error al rechazar el ${itemType === "product" ? "producto" : "servicio"}`,
      },
    };
  }

  if (outcome === "NOT_FOUND") {
    return {
      data: null,
      error: { code: "NOT_FOUND", message: "Ítem no encontrado" },
    };
  }

  if (outcome === "CONFLICT") {
    return {
      data: null,
      error: {
        code: "CONFLICT",
        message:
          "El ítem cambió mientras lo revisabas. Recarga para ver la última versión.",
      },
    };
  }

  await markReviewRequestsAsRead(itemType, itemId);
  await notifySellerOfReview({ item, itemType, approved: false, reason });

  revalidatePath("/organizations");
  revalidatePath("/admin");

  return {
    data: { success: true },
    error: null,
  };
};
