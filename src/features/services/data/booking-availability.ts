import { and, eq, gt, lt, ne, sql } from "drizzle-orm";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { NeonTransaction } from "drizzle-orm/neon-serverless";

import { service, type AvailabilityRules } from "@/shared/lib/drizzle/schema";
import {
  bookingLine,
  transactionHeader,
  transactionLine,
} from "@/shared/lib/drizzle/transactions";
import * as schema from "@/shared/lib/drizzle/schema";

type BookingTransaction = NeonTransaction<
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

type AvailabilityError = "SERVICE_NOT_FOUND" | "UNAVAILABLE" | "CAPACITY_EXCEEDED";

type AvailabilityResult =
  | { available: true; service: typeof service.$inferSelect }
  | { available: false; code: AvailabilityError; message: string };

type AvailabilityInput = {
  serviceId: string;
  startDate: Date;
  endDate: Date;
  quantity: number;
};

const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

const toUtcDayKey = (date: Date) => date.toISOString().slice(0, 10);

const dateAtUtcTime = (date: Date, time: string) => {
  const [hours, minutes] = time.split(":").map(Number);

  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hours, minutes),
  );
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

const getScheduleIntervals = (
  rules: AvailabilityRules,
  startDate: Date,
  endDate: Date,
) => {
  const intervals: Array<{ start: Date; end: Date }> = [];
  const firstDay = new Date(
    Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()),
  );
  const lastDay = new Date(
    Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()),
  );

  for (let day = addDays(firstDay, -1); day <= lastDay; day = addDays(day, 1)) {
    const weekday = WEEKDAYS[day.getUTCDay()];
    const slots = rules.schedule?.[weekday] ?? [];

    for (const slot of slots) {
      const slotStart = dateAtUtcTime(day, slot.start);
      const slotEnd = dateAtUtcTime(day, slot.end);

      intervals.push({
        start: slotStart,
        end: slotEnd > slotStart ? slotEnd : addDays(slotEnd, 1),
      });
    }
  }

  return intervals.sort((left, right) => left.start.getTime() - right.start.getTime());
};

const isCoveredBySchedule = (
  rules: AvailabilityRules,
  startDate: Date,
  endDate: Date,
) => {
  if (!rules.schedule || Object.keys(rules.schedule).length === 0) return true;

  let coveredUntil = startDate;

  for (const interval of getScheduleIntervals(rules, startDate, endDate)) {
    if (interval.end <= coveredUntil || interval.start > coveredUntil) continue;

    if (interval.end > coveredUntil) coveredUntil = interval.end;
    if (coveredUntil >= endDate) return true;
  }

  return false;
};

const intersectsBlockedDate = (
  blockedDates: string[] | undefined,
  startDate: Date,
  endDate: Date,
) => {
  if (!blockedDates?.length) return false;

  const blockedDayKeys = new Set(blockedDates.map((date) => date.slice(0, 10)));
  const lastIncludedDay = new Date(endDate.getTime() - 1);

  for (
    let day = new Date(
      Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()),
    );
    day <= lastIncludedDay;
    day = addDays(day, 1)
  ) {
    if (blockedDayKeys.has(toUtcDayKey(day))) return true;
  }

  return false;
};

const validateScheduleAndBlockedDates = (
  rules: AvailabilityRules | null,
  startDate: Date,
  endDate: Date,
): AvailabilityResult | null => {
  if (!rules) return null;

  if (intersectsBlockedDate(rules.blockedDates, startDate, endDate)) {
    return {
      available: false,
      code: "UNAVAILABLE",
      message: "El servicio no está disponible en las fechas seleccionadas.",
    };
  }

  if (!isCoveredBySchedule(rules, startDate, endDate)) {
    return {
      available: false,
      code: "UNAVAILABLE",
      message: "El horario seleccionado está fuera de la disponibilidad del servicio.",
    };
  }

  return null;
};

export const validateBookingAvailability = async (
  tx: BookingTransaction,
  input: AvailabilityInput,
): Promise<AvailabilityResult> => {
  const [foundService] = await tx
    .select()
    .from(service)
    .where(
      and(
        eq(service.id, input.serviceId),
        eq(service.status, "approved"),
        eq(service.deleted, false),
      ),
    )
    .for("update")
    .limit(1);

  if (!foundService) {
    return {
      available: false,
      code: "SERVICE_NOT_FOUND",
      message: "El servicio solicitado no existe o no está disponible.",
    };
  }

  const scheduleError = validateScheduleAndBlockedDates(
    foundService.availabilityRules,
    input.startDate,
    input.endDate,
  );
  if (scheduleError) return scheduleError;

  const [occupancy] = await tx
    .select({
      reservedQuantity: sql<number>`coalesce(sum(${transactionLine.quantity}), 0)::int`,
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
        eq(bookingLine.serviceId, input.serviceId),
        lt(bookingLine.startDate, input.endDate),
        gt(bookingLine.endDate, input.startDate),
        ne(transactionHeader.status, "cancelled"),
      ),
    );

  if ((occupancy?.reservedQuantity ?? 0) + input.quantity > foundService.maxCapacity) {
    return {
      available: false,
      code: "CAPACITY_EXCEEDED",
      message: `No hay suficiente disponibilidad. Capacidad máxima: ${foundService.maxCapacity}.`,
    };
  }

  return { available: true, service: foundService };
};
