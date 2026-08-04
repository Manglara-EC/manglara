"use server";

import { getOccupiedDaysByMonth } from "@/features/services/data/booking-availability";
import { db } from "@/shared/lib/drizzle/server";
import type { ActionResponse } from "@/shared/types";
import { tryCatch } from "@/shared/utils/try-catch";

export type GetOccupiedDaysByMonthInput = {
  serviceId: string;
  year: number;
  month: number;
};

type ErrorCode = "INVALID_MONTH" | "INTERNAL_SERVER_ERROR";

export const getOccupiedDaysByMonthAction = async (
  input: GetOccupiedDaysByMonthInput,
): Promise<ActionResponse<string[], ErrorCode>> => {
  if (
    !Number.isInteger(input.year) ||
    !Number.isInteger(input.month) ||
    input.month < 1 ||
    input.month > 12
  ) {
    return {
      data: null,
      error: {
        code: "INVALID_MONTH",
        message: "Selecciona un mes de calendario válido.",
      },
    };
  }

  const { data: occupiedDays, error } = await tryCatch(
    db.transaction((tx) => getOccupiedDaysByMonth(tx, input)),
  );

  if (error || !occupiedDays) {
    console.error("Error loading occupied booking days:", error);
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "No se pudo cargar la disponibilidad del calendario.",
      },
    };
  }

  return { data: occupiedDays, error: null };
};
