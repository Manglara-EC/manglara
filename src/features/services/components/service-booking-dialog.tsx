"use client";

import { useEffect, useState, useMemo } from "react";
import { format, addDays, differenceInDays, differenceInHours } from "date-fns";
import { ShoppingCartIcon, Loader2Icon, ShieldCheckIcon } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Badge } from "@/shared/components/ui/badge";
import { formatCurrency } from "@/shared/utils/currency";
import { Separator } from "@/shared/components/ui/separator";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Calendar } from "@/shared/components/ui/calendar";
import { getBookingAvailabilityAction } from "@/features/services/actions/get-booking-availability";
import { getOccupiedDaysByMonthAction } from "@/features/services/actions/get-occupied-days-by-month";
import type { PublicService } from "@/features/services/types";
import type { AccommodationConfig } from "@/shared/lib/drizzle/schema";
import { useCart } from "@/features/cart/context/cart-context";

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

  // Default dates helper
  const today = useMemo(() => new Date(), []);
  const defaultStart = useMemo(
    () => format(addDays(today, 1), "yyyy-MM-dd"),
    [today],
  );
  const defaultEnd = useMemo(
    () => format(addDays(today, 2), "yyyy-MM-dd"),
    [today],
  );

  // State
  const [startDateStr, setStartDateStr] = useState(defaultStart);
  const [endDateStr, setEndDateStr] = useState(defaultEnd);
  const [startTimeStr, setStartTimeStr] = useState("09:00");
  const [endTimeStr, setEndTimeStr] = useState("17:00");
  const [quantity, setQuantity] = useState<number | "">(1);
  const [notes, setNotes] = useState("");
  const [availability, setAvailability] = useState<{
    availableCapacity: number;
    maxCapacity: number;
    canBook: boolean;
    message?: string;
    loading?: boolean;
  } | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [occupiedDays, setOccupiedDays] = useState<string[]>([]);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  const basePrice = Number(service.price) || 0;
  const isAccommodation = service.serviceType === "accommodation";
  const isActivity = service.serviceType === "activity";
  const isSingleDayService =
    service.serviceType === "parking" ||
    service.serviceType === "hammock" ||
    service.serviceType === "rental";
  const isTimeBased = isSingleDayService || service.priceUnit === "hour";
  const accommodationConfig =
    service.serviceConfig as AccommodationConfig | null;
  // Keep the established times only for accommodations created before these fields existed.
  const checkInTime = accommodationConfig?.checkInTime ?? "14:00";
  const checkOutTime = accommodationConfig?.checkOutTime ?? "11:00";
  const occupiedCalendarDays = useMemo(
    () => occupiedDays.map((day) => new Date(`${day}T12:00:00`)),
    [occupiedDays],
  );

  // Calculate duration units & total price
  const calculation = useMemo(() => {
    let units = 1;
    let unitLabel = "reserva";

    if (isAccommodation) {
      const dStart = new Date(startDateStr);
      const dEnd = new Date(endDateStr);
      const nights = differenceInDays(dEnd, dStart);
      units = nights > 0 ? nights : 1;
      unitLabel = units === 1 ? "noche" : "noches";
    } else if (isSingleDayService) {
      if (service.priceUnit === "hour") {
        const startDt = new Date(`${startDateStr}T${startTimeStr}`);
        const endDt = new Date(`${startDateStr}T${endTimeStr}`);
        const hours = differenceInHours(endDt, startDt);
        units = hours > 0 ? hours : 1;
        unitLabel = units === 1 ? "hora" : "horas";
      } else {
        units = 1;
        unitLabel = "día";
      }
    } else if (isTimeBased) {
      if (service.priceUnit === "hour") {
        const startDt = new Date(`${startDateStr}T${startTimeStr}`);
        const endDt = new Date(`${startDateStr}T${endTimeStr}`);
        const hours = differenceInHours(endDt, startDt);
        units = hours > 0 ? hours : 1;
        unitLabel = units === 1 ? "hora" : "horas";
      } else if (service.priceUnit === "day") {
        const dStart = new Date(startDateStr);
        const dEnd = new Date(endDateStr);
        const days = differenceInDays(dEnd, dStart) + 1;
        units = days > 0 ? days : 1;
        unitLabel = units === 1 ? "día" : "días";
      }
    } else if (service.priceUnit === "person") {
      unitLabel = "persona";
    }

    const numQty = typeof quantity === "number" && quantity > 0 ? quantity : 1;
    let calculatedTotal = basePrice * numQty;
    if (isAccommodation || (isTimeBased && service.priceUnit !== "flat_rate")) {
      calculatedTotal = basePrice * units * numQty;
    }

    return {
      units,
      unitLabel,
      totalAmount: calculatedTotal,
    };
  }, [
    isAccommodation,
    isSingleDayService,
    isTimeBased,
    startDateStr,
    endDateStr,
    startTimeStr,
    endTimeStr,
    quantity,
    basePrice,
    service.priceUnit,
  ]);

  const bookingInterval = useMemo(() => {
    if (isAccommodation) {
      return {
        startIso: new Date(`${startDateStr}T${checkInTime}:00`).toISOString(),
        endIso: new Date(`${endDateStr}T${checkOutTime}:00`).toISOString(),
      };
    }

    if (isActivity) {
      const start = new Date(`${startDateStr}T${startTimeStr}:00`);
      const end = new Date(
        start.getTime() + (service.durationMinutes || 120) * 60000,
      );

      return { startIso: start.toISOString(), endIso: end.toISOString() };
    }

    if (isSingleDayService) {
      return {
        startIso: new Date(`${startDateStr}T${startTimeStr}:00`).toISOString(),
        endIso: new Date(`${startDateStr}T${endTimeStr}:00`).toISOString(),
      };
    }

    return {
      startIso: new Date(`${startDateStr}T${startTimeStr}:00`).toISOString(),
      endIso: new Date(`${endDateStr}T${endTimeStr}:00`).toISOString(),
    };
  }, [
    endDateStr,
    endTimeStr,
    isAccommodation,
    isActivity,
    isSingleDayService,
    checkInTime,
    checkOutTime,
    service.durationMinutes,
    startDateStr,
    startTimeStr,
  ]);

  useEffect(() => {
    if (!open || !bookingInterval.startIso || !bookingInterval.endIso) return;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const finalQty =
      typeof quantity === "number" && quantity >= 1 ? quantity : 1;
    addBooking({
      serviceId: service.id,
      serviceName: service.name,
      serviceImage: service.images?.[0] ?? null,
      estimatedUnitPrice: service.price,
      estimatedTotal: calculation.totalAmount,
      startDate: bookingInterval.startIso,
      endDate: bookingInterval.endIso,
      quantity: finalQty,
      notes: notes.trim() || undefined,
    });

    toast.success("Reserva agregada al carrito", {
      description: `Configura el pago para confirmar "${service.name}".`,
    });
    onOpenChange(false);
    setIsSubmitting(false);
  };

  const formattedPrice = formatCurrency;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs uppercase tracking-wide"
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
          </div>
          <DialogTitle className="text-xl font-bold mt-1">
            Reservar: {service.name}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Completa los detalles de tu reserva a continuación.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* Fechas / Horarios según tipo */}
          {isAccommodation && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="checkIn" className="text-xs font-semibold">
                    Fecha de Check-in
                  </Label>
                  <Input
                    id="checkIn"
                    type="date"
                    min={format(today, "yyyy-MM-dd")}
                    value={startDateStr}
                    onChange={(e) => setStartDateStr(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="checkOut" className="text-xs font-semibold">
                    Fecha de Check-out
                  </Label>
                  <Input
                    id="checkOut"
                    type="date"
                    min={startDateStr}
                    value={endDateStr}
                    onChange={(e) => setEndDateStr(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Disponibilidad</p>
                    <p className="text-xs text-muted-foreground">
                      Las fechas en rojo ya están ocupadas o bloqueadas.
                    </p>
                  </div>
                  {isCalendarLoading && (
                    <Loader2Icon className="size-4 shrink-0 animate-spin text-muted-foreground" />
                  )}
                </div>

                {calendarError ? (
                  <p className="text-sm text-destructive">{calendarError}</p>
                ) : (
                  <Calendar
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    showOutsideDays={false}
                    modifiers={{ occupied: occupiedCalendarDays }}
                    modifiersClassNames={{
                      occupied:
                        "bg-destructive/10 text-destructive line-through hover:bg-destructive/15",
                    }}
                    className="w-full rounded-md bg-background p-2"
                  />
                )}
              </div>
            </div>
          )}

          {isActivity && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="actDate" className="text-xs font-semibold">
                  Fecha de la Actividad
                </Label>
                <Input
                  id="actDate"
                  type="date"
                  min={format(today, "yyyy-MM-dd")}
                  value={startDateStr}
                  onChange={(e) => {
                    setStartDateStr(e.target.value);
                    setEndDateStr(e.target.value);
                  }}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="actTime" className="text-xs font-semibold">
                  Hora de Inicio
                </Label>
                <Input
                  id="actTime"
                  type="time"
                  value={startTimeStr}
                  onChange={(e) => setStartTimeStr(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {isSingleDayService && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="singleDate" className="text-sm font-semibold">
                  Fecha del Servicio / Uso
                </Label>
                <Input
                  id="singleDate"
                  type="date"
                  min={format(today, "yyyy-MM-dd")}
                  value={startDateStr}
                  onChange={(e) => {
                    setStartDateStr(e.target.value);
                    setEndDateStr(e.target.value);
                  }}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="startTime" className="text-sm font-semibold">
                    Hora de Entrada / Inicio
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTimeStr}
                    onChange={(e) => setStartTimeStr(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endTime" className="text-sm font-semibold">
                    Hora de Salida / Fin
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTimeStr}
                    onChange={(e) => setEndTimeStr(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {!isAccommodation && !isActivity && !isSingleDayService && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate" className="text-xs font-semibold">
                    Fecha de Inicio
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    min={format(today, "yyyy-MM-dd")}
                    value={startDateStr}
                    onChange={(e) => setStartDateStr(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="startTime" className="text-xs font-semibold">
                    Hora de Inicio
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTimeStr}
                    onChange={(e) => setStartTimeStr(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="endDate" className="text-xs font-semibold">
                    Fecha de Fin
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    min={startDateStr}
                    value={endDateStr}
                    onChange={(e) => setEndDateStr(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endTime" className="text-xs font-semibold">
                    Hora de Fin
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTimeStr}
                    onChange={(e) => setEndTimeStr(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Cantidad / Huéspedes */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="quantity" className="text-sm font-semibold">
                {isAccommodation
                  ? "Número de huéspedes"
                  : isActivity
                    ? "Número de participantes"
                    : "Cantidad / Cupos"}
              </Label>
              <span className="text-sm text-muted-foreground">
                {availability?.loading
                  ? "Consultando disponibilidad..."
                  : availability?.message
                    ? availability.message
                    : availability
                      ? `Plazas disponibles : ${availability.availableCapacity} de ${availability.maxCapacity}`
                      : "Selecciona las fechas para consultar disponibilidad"}
              </span>
            </div>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={
                availability
                  ? availability.availableCapacity
                  : service.maxCapacity || 99
              }
              disabled={
                availability?.loading ||
                (availability?.availableCapacity === 0 &&
                  availability.canBook === false)
              }
              value={quantity}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  setQuantity("");
                } else {
                  const parsed = parseInt(val, 10);
                  if (!isNaN(parsed)) {
                    setQuantity(parsed);
                  }
                }
              }}
              onBlur={() => {
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
              required
            />
          </div>

          {/* Notas opcionales */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-semibold">
              Notas o requerimientos especiales (opcional)
            </Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder="Ej: hora estimada de llegada, alergias, requerimientos..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Separator />

          {/* Resumen de costos */}
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tarifa base:</span>
                <span>{formattedPrice(basePrice)}</span>
              </div>

              {isAccommodation && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Duración:</span>
                  <span>
                    {calculation.units} {calculation.unitLabel}
                  </span>
                </div>
              )}

              {typeof quantity === "number" && quantity > 1 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Cantidad / Personas:</span>
                  <span>x {quantity}</span>
                </div>
              )}

              <Separator className="my-1" />

              <div className="flex justify-between items-center font-bold text-base pt-1">
                <span>Total a pagar:</span>
                <span className="text-primary text-lg">
                  {formattedPrice(calculation.totalAmount)}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300">
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
