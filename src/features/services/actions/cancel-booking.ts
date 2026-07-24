"use server";

import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { db } from "@/shared/lib/drizzle/server";
import { auth } from "@/shared/lib/better-auth/server";
import {
  transactionHeader,
  transactionLine,
  bookingLine,
  parentOrder,
} from "@/shared/lib/drizzle/transactions";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

type ErrorCode =
  | "UNAUTHORIZED"
  | "BOOKING_NOT_FOUND"
  | "CANNOT_CANCEL"
  | "INTERNAL_SERVER_ERROR";

export const cancelBooking = async (
  bookingLineId: string,
): Promise<ActionResponse<{ success: boolean }, ErrorCode>> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Debes iniciar sesión para cancelar una reserva.",
      },
    };
  }

  // Find booking line
  const { data: bookingRecord, error: findError } = await tryCatch(
    db
      .select({
        id: bookingLine.transactionLineId,
        userId: bookingLine.userId,
        startDate: bookingLine.startDate,
        transactionId: transactionLine.transactionId,
        parentOrderId: transactionHeader.parentOrderId,
        status: transactionHeader.status,
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
          eq(bookingLine.transactionLineId, bookingLineId),
          eq(bookingLine.userId, session.user.id),
        ),
      )
      .limit(1),
  );

  if (findError || !bookingRecord || bookingRecord.length === 0) {
    return {
      data: null,
      error: {
        code: "BOOKING_NOT_FOUND",
        message: "Reserva no encontrada.",
      },
    };
  }

  const booking = bookingRecord[0];

  if (booking.status === "cancelled") {
    return {
      data: null,
      error: {
        code: "CANNOT_CANCEL",
        message: "La reserva ya se encuentra cancelada.",
      },
    };
  }

  // Perform update in transaction
  const { error: updateError } = await tryCatch(
    db.transaction(async (tx) => {
      await tx
        .update(transactionHeader)
        .set({ status: "cancelled" })
        .where(eq(transactionHeader.id, booking.transactionId));

      await tx
        .update(parentOrder)
        .set({ status: "cancelled" })
        .where(eq(parentOrder.id, booking.parentOrderId));
    }),
  );

  if (updateError) {
    console.error("Error cancelling booking:", updateError);
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al cancelar la reserva.",
      },
    };
  }

  return {
    data: { success: true },
    error: null,
  };
};
