// Helpers internos de moderación: solo se invocan desde server actions que ya
// validan la sesión. No llevan "use server" para no exponerlos al cliente.

import { and, eq } from "drizzle-orm";

import { db } from "@/shared/lib/drizzle/server";
import { product, request, service } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ItemType } from "@/shared/types";

export interface ModeratedItem {
  id: string;
  name: string;
  sellerId: string;
  organizationId: string;
  status: string;
  deleted: boolean;
  updatedAt: Date;
}

export const loadItemScope = async (
  itemType: ItemType,
  itemId: string,
): Promise<ModeratedItem | null> => {
  const table = itemType === "product" ? product : service;

  const [row] = await db
    .select({
      id: table.id,
      name: table.name,
      sellerId: table.sellerId,
      organizationId: table.organizationId,
      status: table.status,
      deleted: table.deleted,
      updatedAt: table.updatedAt,
    })
    .from(table)
    .where(eq(table.id, itemId))
    .limit(1);

  return row ?? null;
};

/**
 * Aplica la decisión de moderación de forma atómica: bloquea la fila y solo
 * actualiza si sigue siendo la versión revisada (`expectedUpdatedAt`, o la
 * leída al validar permisos). Así nunca se aprueba contenido que el moderador
 * no vio porque el vendedor lo editó en medio.
 */
export const applyReviewDecision = async ({
  itemType,
  item,
  expectedUpdatedAt,
  values,
}: {
  itemType: ItemType;
  item: ModeratedItem;
  expectedUpdatedAt?: Date;
  values: {
    status: "approved" | "rejected";
    approvedBy: string;
    rejectionReason: string | null;
  };
}): Promise<"OK" | "NOT_FOUND" | "CONFLICT"> => {
  const table = itemType === "product" ? product : service;
  const reviewedVersion = (expectedUpdatedAt ?? item.updatedAt).getTime();

  return db.transaction(async (tx) => {
    const [current] = await tx
      .select({ updatedAt: table.updatedAt, deleted: table.deleted })
      .from(table)
      .where(eq(table.id, item.id))
      .for("update");

    if (!current || current.deleted) return "NOT_FOUND";
    if (current.updatedAt.getTime() !== reviewedVersion) return "CONFLICT";

    const now = new Date();
    await tx
      .update(table)
      .set({ ...values, approvedAt: now, updatedAt: now })
      .where(eq(table.id, item.id));

    return "OK";
  });
};

/** Marca como leídas las solicitudes de revisión del ítem (de todos los admins). */
export const markReviewRequestsAsRead = async (
  itemType: ItemType,
  itemId: string,
) =>
  tryCatch(
    db
      .update(request)
      .set({ read: true })
      .where(
        and(
          itemType === "product"
            ? eq(request.productId, itemId)
            : eq(request.serviceId, itemId),
          eq(request.type, `${itemType}_request`),
        ),
      ),
  );

/** Notifica al vendedor el resultado de la revisión. */
export const notifySellerOfReview = async ({
  item,
  itemType,
  approved,
  reason,
}: {
  item: ModeratedItem;
  itemType: ItemType;
  approved: boolean;
  reason?: string;
}) =>
  tryCatch(
    db.insert(request).values({
      id: crypto.randomUUID(),
      userId: item.sellerId,
      type: `${itemType}_${approved ? "approved" : "rejected"}`,
      message: approved
        ? `Tu ${itemType === "product" ? "producto" : "servicio"} "${item.name}" fue aprobado`
        : `Tu ${itemType === "product" ? "producto" : "servicio"} "${item.name}" fue rechazado${reason ? `: ${reason}` : ""}`,
      productId: itemType === "product" ? item.id : null,
      serviceId: itemType === "service" ? item.id : null,
      referenceType: itemType,
      createdAt: new Date(),
    }),
  );
