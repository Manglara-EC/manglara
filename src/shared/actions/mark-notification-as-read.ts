"use server";

import { eq, and } from "drizzle-orm";

import { db } from "@/shared/lib/drizzle/server";
import { request } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import { ItemType } from "@/shared/types";

export const markRequestAsReadByItem = async ({
  userId,
  itemId,
  type,
}: {
  userId: string;
  itemId: string;
  type: ItemType;
}) => {
  await tryCatch(
    db
      .update(request)
      .set({ read: true })
      .where(
        and(
          type === "product"
            ? eq(request.productId, itemId)
            : eq(request.serviceId, itemId),

          eq(request.referenceType, type),
          eq(request.userId, userId),
        ),
      ),
  );
};
