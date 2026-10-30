"use server";

import { revalidatePath } from "next/cache";

import { tryCatch } from "@/shared/utils/try-catch";
import { getViewer } from "@/shared/lib/authz/server";
import { canModerateItem, isOwnItem } from "@/shared/lib/authz/access";
import type { ActionResponse } from "@/shared/types";

import {
  moderateItemSchema,
  type ModerateItemInput,
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
 * Aprueba un producto o servicio.
 * Pueden aprobar: el administrador global (cualquier comuna) y los
 * administradores de la comuna del ítem. Nadie aprueba sus propios ítems.
 */
export const approveItem = async (
  input: ModerateItemInput,
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

  const validation = moderateItemSchema.safeParse(input);

  if (!validation.success) {
    return {
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.error.issues[0]?.message ?? "Datos inválidos",
      },
    };
  }

  const { itemId, itemType, expectedUpdatedAt } = validation.data;
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
          ? "No puedes aprobar tus propios ítems"
          : "No tienes permiso para aprobar ítems de esta comuna",
      },
    };
  }

  const { data: outcome, error } = await tryCatch(
    applyReviewDecision({
      itemType,
      item,
      expectedUpdatedAt,
      values: {
        status: "approved",
        approvedBy: viewer.session.user.id,
        rejectionReason: null,
      },
    }),
  );

  if (error || !outcome) {
    console.error(`Error moderating ${itemType}:`, error);
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: `Error al aprobar el ${itemType === "product" ? "producto" : "servicio"}`,
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
  await notifySellerOfReview({ item, itemType, approved: true });

  revalidatePath("/organizations");
  revalidatePath("/admin");

  return {
    data: { success: true },
    error: null,
  };
};
