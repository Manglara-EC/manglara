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

interface ApproveItemInput {
  itemId: string;
  itemType: "product" | "service";
}

export const approveItem = async (
  input: ApproveItemInput,
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

  // Solo admin puede aprobar
  if (session.user.role !== "admin") {
    return {
      data: null,
      error: {
        code: "FORBIDDEN",
        message: "Solo los administradores pueden aprobar items",
      },
    };
  }

  const { itemId, itemType } = input;

  if (itemType === "service") {
    const { error } = await tryCatch(
      db
        .update(service)
        .set({
          status: "approved",
          approvedBy: session.user.id,
          approvedAt: new Date(),
          rejectionReason: null,
          updatedAt: new Date(),
        })
        .where(eq(service.id, itemId)),
    );

    if (error) {
      console.error("Error approving service:", error);
      return {
        data: null,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Error al aprobar el servicio",
        },
      };
    }
  } else {
    const { error } = await tryCatch(
      db
        .update(product)
        .set({
          status: "approved",
          approvedBy: session.user.id,
          approvedAt: new Date(),
          rejectionReason: null,
          updatedAt: new Date(),
        })
        .where(eq(product.id, itemId)),
    );

    if (error) {
      console.error("Error approving product:", error);
      return {
        data: null,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Error al aprobar el producto",
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
