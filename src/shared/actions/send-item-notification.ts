// Helper interno: solo se invoca desde server actions que ya validan la sesión.
// No lleva "use server" para no exponerlo como endpoint invocable desde el cliente.

import { eq, and, inArray, ne } from "drizzle-orm";

import { db } from "@/shared/lib/drizzle/server";
import { member, request } from "@/shared/lib/drizzle/schema";
import { MANAGING_ORGANIZATION_ROLES } from "@/shared/constants/roles";
import { tryCatch } from "@/shared/utils/try-catch";
import { ItemType } from "@/shared/types";

interface NotifyOwnerParams {
  organizationId: string;
  itemName: string;
  itemId: string;
  type: ItemType;
  /** Quien publicó o editó el ítem; no se le notifica a sí mismo. */
  sellerId: string;
  /** `updated`: el ítem se editó y volvió a revisión. */
  reason?: "created" | "updated";
}

/**
 * Avisa a los administradores de la comuna (owner/admin) que hay un ítem
 * pendiente de revisión.
 */
export const notifyOwnerOfNewItem = async ({
  organizationId,
  itemName,
  itemId,
  type,
  sellerId,
  reason = "created",
}: NotifyOwnerParams) => {
  const { data: managers } = await tryCatch(
    db
      .select({ userId: member.userId })
      .from(member)
      .where(
        and(
          eq(member.organizationId, organizationId),
          inArray(member.role, [...MANAGING_ORGANIZATION_ROLES]),
          ne(member.userId, sellerId),
        ),
      ),
  );

  if (!managers || managers.length === 0) return;

  const productId = type === "product" ? itemId : null;
  const serviceId = type === "service" ? itemId : null;
  const noun = type === "product" ? "producto" : "servicio";
  const message =
    reason === "updated"
      ? `Se editó el ${noun} "${itemName}" y espera revisión`
      : `Nuevo ${noun} "${itemName}" pendiente de revisión`;

  await tryCatch(
    db.insert(request).values(
      managers.map((manager) => ({
        id: crypto.randomUUID(),
        userId: manager.userId,
        type: `${type}_request`,
        message,
        productId,
        serviceId,
        referenceType: type,
        createdAt: new Date(),
      })),
    ),
  );
};
