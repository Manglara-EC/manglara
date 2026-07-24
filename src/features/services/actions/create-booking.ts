"use server";

import { headers } from "next/headers";
import { db } from "@/shared/lib/drizzle/server";
import { auth } from "@/shared/lib/better-auth/server";
import { request } from "@/shared/lib/drizzle/schema";
import {
  parentOrder,
  transactionHeader,
  transactionLine,
  bookingLine,
} from "@/shared/lib/drizzle/transactions";
import { tryCatch } from "@/shared/utils/try-catch";
import { formatCurrency } from "@/shared/utils/currency";
import type { ActionResponse } from "@/shared/types";

export interface CreateBookingInput {
  serviceId: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  quantity: number;
  totalAmount: number;
  notes?: string;
}

type ErrorCode =
  | "UNAUTHORIZED"
  | "SERVICE_NOT_FOUND"
  | "INVALID_DATES"
  | "INVALID_QUANTITY"
  | "CAPACITY_EXCEEDED"
  | "INTERNAL_SERVER_ERROR";

export const createBooking = async (
  input: CreateBookingInput,
): Promise<ActionResponse<{ bookingId: string; transactionId: string }, ErrorCode>> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Debes iniciar sesión para realizar una reserva.",
      },
    };
  }

  const { serviceId, startDate: startStr, endDate: endStr, quantity, totalAmount, notes } = input;

  const startDate = new Date(startStr);
  const endDate = new Date(endStr);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate <= startDate) {
    return {
      data: null,
      error: {
        code: "INVALID_DATES",
        message: "La fecha y hora de fin debe ser posterior a la fecha y hora de inicio.",
      },
    };
  }

  if (!quantity || quantity <= 0) {
    return {
      data: null,
      error: {
        code: "INVALID_QUANTITY",
        message: "La cantidad debe ser de al menos 1.",
      },
    };
  }

  // Fetch service details
  const { data: foundService, error: serviceError } = await tryCatch(
    db.query.service.findFirst({
      where: (s, { eq, and }) =>
        and(eq(s.id, serviceId), eq(s.status, "approved"), eq(s.deleted, false)),
    }),
  );

  if (serviceError || !foundService) {
    return {
      data: null,
      error: {
        code: "SERVICE_NOT_FOUND",
        message: "El servicio solicitado no existe o no está disponible.",
      },
    };
  }

  if (foundService.maxCapacity && quantity > foundService.maxCapacity) {
    return {
      data: null,
      error: {
        code: "CAPACITY_EXCEEDED",
        message: `La cantidad ingresada supera la capacidad máxima del servicio (${foundService.maxCapacity}).`,
      },
    };
  }

  // Execute database transaction
  const { data: transactionResult, error: transactionError } = await tryCatch(
    db.transaction(async (tx) => {
      const parentOrderId = crypto.randomUUID();
      const transactionId = crypto.randomUUID();
      const transactionLineId = crypto.randomUUID();

      // 1. Create parent order header
      await tx.insert(parentOrder).values({
        id: parentOrderId,
        customerId: session.user.id,
        totalAmount: totalAmount.toFixed(2),
        status: "completed",
        createdAt: new Date(),
      });

      // 2. Create transaction header for seller
      await tx.insert(transactionHeader).values({
        id: transactionId,
        parentOrderId: parentOrderId,
        sellerId: foundService.sellerId,
        customerId: session.user.id,
        totalAmount: totalAmount.toFixed(2),
        status: "completed",
        createdAt: new Date(),
      });

      // 3. Create generic transaction line
      const unitPrice = (totalAmount / quantity).toFixed(2);
      await tx.insert(transactionLine).values({
        id: transactionLineId,
        transactionId: transactionId,
        type: "booking",
        unitPrice: unitPrice,
        quantity: quantity,
        discount: "0",
        taxes: "0",
        totalAmount: totalAmount.toFixed(2),
        createdAt: new Date(),
      });

      // 4. Create booking line
      await tx.insert(bookingLine).values({
        transactionLineId: transactionLineId,
        serviceId: foundService.id,
        userId: session.user.id,
        startDate: startDate,
        endDate: endDate,
        notes: notes || null,
      });

      // 5. Create notification request for seller
      try {
        const formattedAmount = formatCurrency(totalAmount);

        await tx.insert(request).values({
          id: crypto.randomUUID(),
          userId: foundService.sellerId,
          type: "service_booked",
          message: `Nueva reserva realizada por ${session.user.name || session.user.email} para el servicio "${foundService.name}". Valor: ${formattedAmount}`,
          read: false,
          serviceId: foundService.id,
          referenceType: "service",
          createdAt: new Date(),
        });
      } catch (reqErr) {
        console.error("Error inserting seller notification request:", reqErr);
      }

      return { bookingId: transactionLineId, transactionId };
    }),
  );

  if (transactionError || !transactionResult) {
    console.error("Booking error:", transactionError);
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al procesar la reserva. Por favor, intenta de nuevo.",
      },
    };
  }

  return {
    data: transactionResult,
    error: null,
  };
};
