// Helper interno de servidor (sin "use server": no es un endpoint).

import { eq } from "drizzle-orm";

import { db } from "@/shared/lib/drizzle/server";
import { bookingLine, productLine } from "@/shared/lib/drizzle/transactions";
import type { ItemType } from "@/shared/types";

/** ¿El ítem tiene ventas o reservas registradas? */
export const hasSalesOrBookings = async (
  itemType: ItemType,
  itemId: string,
) => {
  if (itemType === "service") {
    const bookings = await db
      .select({ id: bookingLine.transactionLineId })
      .from(bookingLine)
      .where(eq(bookingLine.serviceId, itemId))
      .limit(1);

    return bookings.length > 0;
  }

  const [sales, bookings] = await Promise.all([
    db
      .select({ id: productLine.transactionLineId })
      .from(productLine)
      .where(eq(productLine.productId, itemId))
      .limit(1),
    db
      .select({ id: bookingLine.transactionLineId })
      .from(bookingLine)
      .where(eq(bookingLine.productId, itemId))
      .limit(1),
  ]);

  return sales.length > 0 || bookings.length > 0;
};
