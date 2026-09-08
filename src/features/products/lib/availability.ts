import { and, eq, sql, sum } from "drizzle-orm";

import { db } from "@/shared/lib/drizzle/server";
import {
  transactionHeader,
  transactionLine,
  bookingLine,
} from "@/shared/lib/drizzle/transactions";

// Acepta tanto el cliente normal de drizzle como el `tx` dentro de un
// `db.transaction(...)`, para poder reusar esta función también en el checkout.
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type QueryableDb = typeof db | Tx;

/**
 * Calcula cuántas unidades de un producto reservable ya están comprometidas
 * (reservadas) para una fecha específica, contando solo transacciones que no
 * estén canceladas.
 */
export const getBookedQuantityForDate = async (
  queryDb: QueryableDb,
  productId: string,
  date: string, // formato "YYYY-MM-DD"
): Promise<number> => {
  const result = await queryDb
    .select({
      totalBooked: sum(transactionLine.quantity),
    })
    .from(bookingLine)
    .innerJoin(
      transactionLine,
      eq(bookingLine.transactionLineId, transactionLine.id),
    )
    .innerJoin(
      transactionHeader,
      eq(transactionLine.transactionId, transactionHeader.id),
    )
    .where(
      and(
        eq(bookingLine.productId, productId),
        sql`DATE(${bookingLine.startDate}) = ${date}`,
        sql`${transactionHeader.status} != 'cancelled'`,
        sql`${transactionLine.status} != 'cancelled'`,
      ),
    );

  return Number(result[0]?.totalBooked ?? 0);
};
