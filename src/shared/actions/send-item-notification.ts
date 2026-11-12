// Helper interno: solo se invoca desde server actions que ya validan la sesión.
// No lleva "use server" para no exponerlo como endpoint invocable desde el cliente.

import { eq, and } from "drizzle-orm";

import { db } from "@/shared/lib/drizzle/server";
import { member, request } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import { ItemType } from "@/shared/types";

interface NotifyOwnerParams {
  organizationId: string;
  itemName: string;
  itemId: string;
  type: ItemType;
}

export const notifyOwnerOfNewItem = async ({
  organizationId,
  itemName,
  itemId,
  type,
}: NotifyOwnerParams) => {
  const { data: ownerMembership } = await tryCatch(
    db.query.member.findFirst({
      where: and(
        eq(member.organizationId, organizationId),
        eq(member.role, "owner"),
      ),
    }),
  );

  if (!ownerMembership) return;

  const productId = type === "product" ? itemId : null;
  const serviceId = type === "service" ? itemId : null;

  await tryCatch(
    db.insert(request).values({
      id: crypto.randomUUID(),
      userId: ownerMembership.userId,
      type: `${type}_request`,
      message: `New ${type} pending approval: ${itemName}`,
      productId: productId,
      serviceId: serviceId,
      referenceType: type,
      createdAt: new Date(),
    }),
  );
};
