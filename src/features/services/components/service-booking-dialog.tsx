"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, differenceInDays, differenceInHours, format } from "date-fns";
import { Loader2Icon, ShieldCheckIcon, ShoppingCartIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import { Textarea } from "@/shared/components/ui/textarea";
import { useCart } from "@/features/cart/context/cart-context";
import { getBookingAvailabilityAction } from "@/features/services/actions/get-booking-availability";
import { getOccupiedDaysByMonthAction } from "@/features/services/actions/get-occupied-days-by-month";
import { AccommodationBookingFields } from "@/features/services/components/service-booking-dialog/accommodation-booking-fields";
import { ActivityBookingFields } from "@/features/services/components/service-booking-dialog/activity-booking-fields";
import { BookingPriceSummary } from "@/features/services/components/service-booking-dialog/booking-price-summary";
import {
  BookingQuantityField,
  type BookingAvailability,
} from "@/features/services/components/service-booking-dialog/booking-quantity-field";
import { DateRangeBookingFields } from "@/features/services/components/service-booking-dialog/date-range-booking-fields";
import { SingleDayBookingFields } from "@/features/services/components/service-booking-dialog/single-day-booking-fields";
import type { PublicService } from "@/features/services/types";
import type { AccommodationConfig } from "@/shared/lib/drizzle/schema";

interface ServiceBookingDialogProps {
  service: PublicService;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServiceBookingDialog({
  service,
  open,
  onOpenChange,
}: ServiceBookingDialogProps) {
  const { addBooking } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const today = useMemo(() => new Date(), []);
  const minDate = format(today, "yyyy-MM-dd");
  const defaultStart = useMemo(
    () => format(addDays(today, 1), "yyyy-MM-dd"),
    [today],
  );
  const defaultEnd = useMemo(
    () => format(addDays(today, 2), "yyyy-MM-dd"),
    [today],
  );
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [quantity, setQuantity] = useState<number | "">(1);
  const [notes, setNotes] = useState("");
  const [availability, setAvailability] = useState<BookingAvailability | null>(
    null,
  );
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [occupiedDays, setOccupiedDays] = useState<string[]>([]);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  const basePrice = Number(service.price) || 0;
  const isAccommodation = service.serviceType === "accommodation";
  const isActivity = service.serviceType === "activity";
  const isSingleDayService = ["parking", "hammock", "rental"].includes(
    service.serviceType,
  );
  const isTimeBased = isSingleDayService || service.priceUnit === "hour";
  const accommodationConfig =
    service.serviceConfig as AccommodationConfig | null;
  const checkInTime = accommodationConfig?.checkInTime ?? "14:00";
  const checkOutTime = accommodationConfig?.checkOutTime ?? "11:00";
  const occupiedCalendarDays = useMemo(
    () => occupiedDays.map((day) => new Date(`${day}T12:00:00`)),
    [occupiedDays],
  );

  const calculation = useMemo(() => {
    let units = 1;
    let unitLabel = "reserva";

    if (isAccommodation) {
      const nights = differenceInDays(new Date(endDate), new Date(startDate));
      units = nights > 0 ? nights : 1;
      unitLabel = units === 1 ? "noche" : "noches";
    } else if (isSingleDayService && service.priceUnit === "hour") {
      const hours = differenceInHours(
        new Date(`${startDate}T${endTime}`),
        new Date(`${startDate}T${startTime}`),
      );
      units = hours > 0 ? hours : 1;
      unitLabel = units === 1 ? "hora" : "horas";
    } else if (isSingleDayService) {
      unitLabel = "día";
    } else if (isTimeBased && service.priceUnit === "hour") {
      const hours = differenceInHours(
        new Date(`${startDate}T${endTime}`),
        new Date(`${startDate}T${startTime}`),
      );
      units = hours > 0 ? hours : 1;
      unitLabel = units === 1 ? "hora" : "horas";
    } else if (service.priceUnit === "person") {
      unitLabel = "persona";
    }

    const finalQuantity =
      typeof quantity === "number" && quantity > 0 ? quantity : 1;
    const totalAmount =
      isAccommodation || (isTimeBased && service.priceUnit !== "flat_rate")
        ? basePrice * units * finalQuantity
        : basePrice * finalQuantity;

    return { units, unitLabel, totalAmount };
  }, [
    basePrice,
    endDate,
    endTime,
    isAccommodation,
    isSingleDayService,
    isTimeBased,
    quantity,
    service.priceUnit,
    startDate,
    startTime,
  ]);

  const bookingInterval = useMemo(() => {
    if (isAccommodation) {
      return {
        startIso: new Date(`${startDate}T${checkInTime}:00`).toISOString(),
        endIso: new Date(`${endDate}T${checkOutTime}:00`).toISOString(),
      };
    }
    if (isActivity) {
      const start = new Date(`${startDate}T${startTime}:00`);
      return {
        startIso: start.toISOString(),
        endIso: new Date(
          start.getTime() + (service.durationMinutes || 120) * 60_000,
        ).toISOString(),
      };
    }
    if (isSingleDayService) {
      return {
        startIso: new Date(`${startDate}T${startTime}:00`).toISOString(),
        endIso: new Date(`${startDate}T${endTime}:00`).toISOString(),
      };
    }
    return {
      startIso: new Date(`${startDate}T${startTime}:00`).toISOString(),
      endIso: new Date(`${endDate}T${endTime}:00`).toISOString(),
    };
  }, [
    checkInTime,
    checkOutTime,
    endDate,
    endTime,
    isAccommodation,
    isActivity,
    isSingleDayService,
    service.durationMinutes,
    startDate,
    startTime,
  ]);

  useEffect(() => {
    if (!open) return;

    let ignoreResult = false;
    setAvailability((current) =>
      current
        ? { ...current, loading: true }
        : {
            availableCapacity: 0,
            maxCapacity: service.maxCapacity,
            canBook: false,
            loading: true,
          },
    );

    const checkAvailability = async () => {
      const result = await getBookingAvailabilityAction({
        serviceId: service.id,
        startDate: bookingInterval.startIso,
        endDate: bookingInterval.endIso,
        quantity: typeof quantity === "number" && quantity > 0 ? quantity : 1,
      });
      if (ignoreResult) return;

      if (result.error) {
        setAvailability({
          availableCapacity: 0,
          maxCapacity: service.maxCapacity,
          canBook: false,
          message: result.error.message,
        });
        return;
      }
      setAvailability({ ...result.data, loading: false });
    };

    void checkAvailability();
    return () => {
      ignoreResult = true;
    };
  }, [
    bookingInterval.endIso,
    bookingInterval.startIso,
    open,
    quantity,
    service.id,
    service.maxCapacity,
  ]);

  useEffect(() => {
    if (!open || !isAccommodation) return;

    let ignoreResult = false;
    setIsCalendarLoading(true);
    setCalendarError(null);

    const loadOccupiedDays = async () => {
      const result = await getOccupiedDaysByMonthAction({
        serviceId: service.id,
        year: calendarMonth.getFullYear(),
        month: calendarMonth.getMonth() + 1,
      });
      if (ignoreResult) return;

      if (result.error) {
        setOccupiedDays([]);
        setCalendarError(result.error.message);
      } else {
        setOccupiedDays(result.data);
      }
      setIsCalendarLoading(false);
    };

    void loadOccupiedDays();
    return () => {
      ignoreResult = true;
    };
  }, [calendarMonth, isAccommodation, open, service.id]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    const finalQuantity =
      typeof quantity === "number" && quantity >= 1 ? quantity : 1;

    addBooking({
      serviceId: service.id,
      serviceName: service.name,
      serviceImage: service.images?.[0] ?? null,
      estimatedUnitPrice: service.price,
      estimatedTotal: calculation.totalAmount,
      startDate: bookingInterval.startIso,
      endDate: bookingInterval.endIso,
      quantity: finalQuantity,
      notes: notes.trim() || undefined,
    });
    toast.success("Reserva agregada al carrito", {
      description: `Configura el pago para confirmar "${service.name}".`,
    });
    onOpenChange(false);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[540px]">
        <DialogHeader>
          <Badge
            variant="outline"
            className="w-fit text-xs uppercase tracking-wide"
          >
            {service.serviceType === "accommodation"
              ? "Alojamiento"
              : service.serviceType === "activity"
                ? "Actividad"
                : service.serviceType === "parking"
                  ? "Estacionamiento"
                  : service.serviceType === "rental"
                    ? "Alquiler"
                    : "Servicio"}
          </Badge>
          <DialogTitle className="mt-1 text-xl font-bold">
            Reservar: {service.name}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Completa los detalles de tu reserva a continuación.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {isAccommodation && (
            <AccommodationBookingFields
              startDate={startDate}
              endDate={endDate}
              minDate={minDate}
              calendarMonth={calendarMonth}
              occupiedDays={occupiedCalendarDays}
              isCalendarLoading={isCalendarLoading}
              calendarError={calendarError}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onMonthChange={setCalendarMonth}
            />
          )}
          {isActivity && (
            <ActivityBookingFields
              startDate={startDate}
              startTime={startTime}
              minDate={minDate}
              onDateChange={(value) => {
                setStartDate(value);
                setEndDate(value);
              }}
              onStartTimeChange={setStartTime}
            />
          )}
          {isSingleDayService && (
            <SingleDayBookingFields
              startDate={startDate}
              startTime={startTime}
              endTime={endTime}
              minDate={minDate}
              onDateChange={(value) => {
                setStartDate(value);
                setEndDate(value);
              }}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
            />
          )}
          {!isAccommodation && !isActivity && !isSingleDayService && (
            <DateRangeBookingFields
              startDate={startDate}
              endDate={endDate}
              startTime={startTime}
              endTime={endTime}
              minDate={minDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
            />
          )}

          <BookingQuantityField
            isAccommodation={isAccommodation}
            isActivity={isActivity}
            maxCapacity={service.maxCapacity}
            quantity={quantity}
            availability={availability}
            onQuantityChange={(value) => {
              if (value === "" || !Number.isNaN(value)) setQuantity(value);
            }}
            onQuantityBlur={() => {
              if (quantity === "" || quantity < 1) {
                setQuantity(1);
              } else if (
                availability &&
                availability.availableCapacity > 0 &&
                quantity > availability.availableCapacity
              ) {
                setQuantity(availability.availableCapacity);
              }
            }}
          />

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-semibold">
              Notas o requerimientos especiales (opcional)
            </Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder="Ej: hora estimada de llegada, alergias, requerimientos..."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          <Separator />
          <BookingPriceSummary
            basePrice={basePrice}
            isAccommodation={isAccommodation}
            quantity={quantity}
            units={calculation.units}
            unitLabel={calculation.unitLabel}
            totalAmount={calculation.totalAmount}
          />

          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            <ShieldCheckIcon className="h-4 w-4 shrink-0" />
            <span>
              La disponibilidad se confirmará nuevamente al realizar el pago.
            </span>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || availability?.canBook !== true}
              className="min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <ShoppingCartIcon className="mr-2 h-4 w-4" />
                  Agregar al carrito
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
