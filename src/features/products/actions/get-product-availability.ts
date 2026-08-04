"use server";

import { eq, and } from "drizzle-orm";

import { db } from "@/shared/lib/drizzle/server";
import { product } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

import { getBookedQuantityForDate } from "@/features/products/lib/availability";

type ErrorCode = "NOT_FOUND" | "NOT_RESERVABLE" | "INTERNAL_SERVER_ERROR";

interface AvailabilityResult {
  date: string;
  totalStock: number;
  bookedQuantity: number;
  availableQuantity: number;
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const getProductAvailability = async (
  productId: string,
  date: string,
): Promise<ActionResponse<AvailabilityResult, ErrorCode>> => {
  if (!DATE_REGEX.test(date)) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Fecha inválida",
      },
    };
  }

  const { data: prod, error: productError } = await tryCatch(
    db.query.product.findFirst({
      where: and(
        eq(product.id, productId),
        eq(product.status, "approved"),
        eq(product.deleted, false),
      ),
    }),
  );

  if (productError || !prod) {
    return {
      data: null,
      error: {
        code: "NOT_FOUND",
        message: "Producto no encontrado",
      },
    };
  }

  if (!prod.isReservable) {
    return {
      data: null,
      error: {
        code: "NOT_RESERVABLE",
        message: "Este producto no requiere reserva por fecha",
      },
    };
  }

  const { data: bookedQuantity, error: bookedError } = await tryCatch(
    getBookedQuantityForDate(db, productId, date),
  );

  if (bookedError || bookedQuantity === null) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al calcular la disponibilidad",
      },
    };
  }

  return {
    data: {
      date,
      totalStock: prod.stock,
      bookedQuantity,
      availableQuantity: Math.max(0, prod.stock - bookedQuantity),
    },
    error: null,
  };
};
