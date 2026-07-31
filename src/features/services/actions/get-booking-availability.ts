"use server";

import { db } from "@/shared/lib/drizzle/server";
import {
  getBookingAvailability,
  type AvailabilityError,
} from "@/features/services/data/booking-availability";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

export interface GetBookingAvailabilityInput {
  serviceId: string;
  startDate: string;
  endDate: string;
  quantity: number;
}

export interface BookingAvailability {
  maxCapacity: number;
  reservedQuantity: number;
  availableCapacity: number;
  canBook: boolean;
}

type ErrorCode = AvailabilityError | "INVALID_DATES" | "INTERNAL_SERVER_ERROR";

export const getBookingAvailabilityAction = async (
  input: GetBookingAvailabilityInput,
): Promise<ActionResponse<BookingAvailability, ErrorCode>> => {
  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate <= startDate) {
    return {
      data: null,
      error: {
        code: "INVALID_DATES",
        message: "Selecciona un intervalo de fechas válido.",
      },
    };
  }

  const { data: result, error } = await tryCatch(
    db.transaction((tx) =>
      getBookingAvailability(tx, {
        serviceId: input.serviceId,
        startDate,
        endDate,
        quantity: input.quantity,
      }),
    ),
  );

  if (error || !result) {
    console.error("Error checking booking availability:", error);
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "No se pudo consultar la disponibilidad.",
      },
    };
  }

  if (!result.available) {
    if (
      result.maxCapacity !== undefined &&
      result.reservedQuantity !== undefined &&
      result.availableCapacity !== undefined
    ) {
      return {
        data: {
          maxCapacity: result.maxCapacity,
          reservedQuantity: result.reservedQuantity,
          availableCapacity: result.availableCapacity,
          canBook: false,
        },
        error: null,
      };
    }

    return {
      data: null,
      error: result,
    };
  }

  return {
    data: {
      maxCapacity: result.maxCapacity,
      reservedQuantity: result.reservedQuantity,
      availableCapacity: result.availableCapacity,
      canBook: input.quantity <= result.availableCapacity,
    },
    error: null,
  };
};
