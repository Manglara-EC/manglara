"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { product, service } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

type ErrorCode = "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "INTERNAL_SERVER_ERROR";

interface DeleteItemParams {
  itemId: string;
  itemType: "product" | "service";
}

export async function deleteItem({
  itemId,
  itemType,
}: DeleteItemParams): Promise<ActionResponse<{ id: string }, ErrorCode>> {
  // 1. Verificar autenticación
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Debes iniciar sesión",
      },
    };
  }

  // 2. Verificar que es admin
  if (session.user.role !== "admin") {
    return {
      data: null,
      error: {
        code: "FORBIDDEN",
        message: "Solo los administradores pueden eliminar items",
      },
    };
  }

  // 3. Eliminar el item (soft delete)
  const table = itemType === "product" ? product : service;

  const { error: deleteError } = await tryCatch(
    db
      .update(table)
      .set({
        deleted: true,
        updatedAt: new Date(),
      })
      .where(eq(table.id, itemId))
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

  return {
    data: { id: itemId },
    error: null,
  };
}
