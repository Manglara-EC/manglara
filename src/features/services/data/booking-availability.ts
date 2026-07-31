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

export type AvailabilityError =
  "SERVICE_NOT_FOUND" | "UNAVAILABLE" | "CAPACITY_EXCEEDED";

export type AvailabilityResult =
  | {
      available: true;
      service: typeof service.$inferSelect;
      maxCapacity: number;
      reservedQuantity: number;
      availableCapacity: number;
    }
  | {
      available: false;
      code: AvailabilityError;
      message: string;
      maxCapacity?: number;
      reservedQuantity?: number;
      availableCapacity?: number;
    };

export type AvailabilityInput = {
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

const SERVICE_TIME_ZONE = "America/Bogota";

const serviceTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: SERVICE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

const toServiceLocalDate = (date: Date) => {
  const parts = Object.fromEntries(
    serviceTimeFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  // Use UTC getters to operate on the service's local calendar without changing instants.
  return new Date(
    Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    ),
  );
};

const toUtcDayKey = (date: Date) => date.toISOString().slice(0, 10);

const dateAtUtcTime = (date: Date, time: string) => {
  const [hours, minutes] = time.split(":").map(Number);

  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      hours,
      minutes,
    ),
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
    Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate(),
    ),
  );
  const lastDay = new Date(
    Date.UTC(
      endDate.getUTCFullYear(),
      endDate.getUTCMonth(),
      endDate.getUTCDate(),
    ),
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

  return intervals.sort(
    (left, right) => left.start.getTime() - right.start.getTime(),
  );
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
      Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate(),
      ),
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

  const localStartDate = toServiceLocalDate(startDate);
  const localEndDate = toServiceLocalDate(endDate);

  if (intersectsBlockedDate(rules.blockedDates, localStartDate, localEndDate)) {
    return {
      available: false,
      code: "UNAVAILABLE",
      message: "El servicio no está disponible en las fechas seleccionadas.",
    };
  }

  if (!isCoveredBySchedule(rules, localStartDate, localEndDate)) {
    return {
      available: false,
      code: "UNAVAILABLE",
      message:
        "El horario seleccionado está fuera de la disponibilidad del servicio.",
    };
  }

  return null;
};

export const getBookingAvailability = async (
  tx: BookingTransaction,
  input: AvailabilityInput,
  lockService = false,
): Promise<AvailabilityResult> => {
  const serviceQuery = tx
    .select()
    .from(service)
    .where(
      and(
        eq(service.id, input.serviceId),
        eq(service.status, "approved"),
        eq(service.deleted, false),
      ),
    );

  const [foundService] = lockService
    ? await serviceQuery.for("update").limit(1)
    : await serviceQuery.limit(1);

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

  const reservedQuantity = occupancy?.reservedQuantity ?? 0;
  const availableCapacity = Math.max(
    0,
    foundService.maxCapacity - reservedQuantity,
  );

  if (foundService.serviceType === "accommodation" && reservedQuantity > 0) {
    return {
      available: false,
      code: "UNAVAILABLE",
      message:
        "El alojamiento ya está reservado para las fechas seleccionadas.",
    };
  }

  if (reservedQuantity + input.quantity > foundService.maxCapacity) {
    return {
      available: false,
      code: "CAPACITY_EXCEEDED",
      message: `No hay suficiente disponibilidad. Capacidad máxima: ${foundService.maxCapacity}.`,
      maxCapacity: foundService.maxCapacity,
      reservedQuantity,
      availableCapacity,
    };
  }

  return {
    available: true,
    service: foundService,
    maxCapacity: foundService.maxCapacity,
    reservedQuantity,
    availableCapacity,
  };
};

export const validateBookingAvailability = async (
  tx: BookingTransaction,
  input: AvailabilityInput,
): Promise<AvailabilityResult> => getBookingAvailability(tx, input, true);

export type OccupiedDaysByMonthInput = {
  serviceId: string;
  year: number;
  month: number;
};

export const getOccupiedDaysByMonth = async (
  tx: BookingTransaction,
  input: OccupiedDaysByMonthInput,
): Promise<string[]> => {
  if (
    !Number.isInteger(input.year) ||
    !Number.isInteger(input.month) ||
    input.month < 1 ||
    input.month > 12
  ) {
    throw new Error("El año y mes deben formar un mes de calendario válido.");
  }

  const monthStart = new Date(Date.UTC(input.year, input.month - 1, 1));
  const nextMonthStart = new Date(Date.UTC(input.year, input.month, 1));
  // Widen the query by one day to safely cover America/Bogota calendar boundaries.
  const queryStart = addDays(monthStart, -1);
  const queryEnd = addDays(nextMonthStart, 1);

  const [foundService] = await tx
    .select({ availabilityRules: service.availabilityRules })
    .from(service)
    .where(eq(service.id, input.serviceId))
    .limit(1);

  const bookings = await tx
    .select({
      startDate: bookingLine.startDate,
      endDate: bookingLine.endDate,
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
        lt(bookingLine.startDate, queryEnd),
        gt(bookingLine.endDate, queryStart),
        ne(transactionHeader.status, "cancelled"),
      ),
    );

  const occupiedDays = new Set<string>();
  const isInRequestedMonth = (date: Date) =>
    date.getUTCFullYear() === input.year &&
    date.getUTCMonth() === input.month - 1;

  for (const blockedDate of foundService?.availabilityRules?.blockedDates ??
    []) {
    const blockedDay = new Date(`${blockedDate.slice(0, 10)}T00:00:00.000Z`);
    if (!Number.isNaN(blockedDay.getTime()) && isInRequestedMonth(blockedDay)) {
      occupiedDays.add(toUtcDayKey(blockedDay));
    }
  }

  for (const booking of bookings) {
    const firstOccupiedDay = toServiceLocalDate(booking.startDate);
    // Reservations use [startDate, endDate), so checkout day stays available.
    const lastOccupiedDay = toServiceLocalDate(
      new Date(booking.endDate.getTime() - 1),
    );

    for (
      let day = firstOccupiedDay;
      day <= lastOccupiedDay;
      day = addDays(day, 1)
    ) {
      if (isInRequestedMonth(day)) occupiedDays.add(toUtcDayKey(day));
    }
  }

  return [...occupiedDays].sort();
};
