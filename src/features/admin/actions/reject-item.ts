"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { service, product } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INTERNAL_SERVER_ERROR";

interface RejectItemInput {
  itemId: string;
  itemType: "product" | "service";
  reason: string;
}

export const rejectItem = async (
  input: RejectItemInput,
): Promise<ActionResponse<{ success: boolean }, ErrorCode>> => {
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

  // Solo admin puede rechazar
  if (session.user.role !== "admin") {
    return {
      data: null,
      error: {
        code: "FORBIDDEN",
        message: "Solo los administradores pueden rechazar items",
      },
    };
  }

  const { itemId, itemType, reason } = input;

  if (!reason || reason.trim().length === 0) {
    return {
      data: null,
      error: {
        code: "FORBIDDEN",
        message: "Debes proporcionar una razón para el rechazo",
      },
    };
  }

  if (itemType === "service") {
    const { error } = await tryCatch(
      db
        .update(service)
        .set({
          status: "rejected",
          approvedBy: session.user.id,
          approvedAt: new Date(),
          rejectionReason: reason.trim(),
          updatedAt: new Date(),
        })
        .where(eq(service.id, itemId)),
    );

    if (error) {
      console.error("Error rejecting service:", error);
      return {
        data: null,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Error al rechazar el servicio",
        },
      };
    }
  } else {
    const { error } = await tryCatch(
      db
        .update(product)
        .set({
          status: "rejected",
          approvedBy: session.user.id,
          approvedAt: new Date(),
          rejectionReason: reason.trim(),
          updatedAt: new Date(),
        })
        .where(eq(product.id, itemId)),
    );

    if (error) {
      console.error("Error rejecting product:", error);
      return {
        data: null,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Error al rechazar el producto",
        },
      };
    }
  }

  revalidatePath("/organizations");
  revalidatePath("/admin");

  return {
    data: { success: true },
    error: null,
  };
};
