"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format, addDays, differenceInDays, differenceInHours } from "date-fns";
import {
  CheckCircle2Icon,
  Loader2Icon,
  ShieldCheckIcon,
} from "lucide-react";
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
import { createBooking } from "@/features/services/actions/create-booking";
import type { PublicService } from "@/features/services/types";

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
  const router = useRouter();
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

  const basePrice = Number(service.price) || 0;
  const isAccommodation = service.serviceType === "accommodation";
  const isActivity = service.serviceType === "activity";
  const isSingleDayService =
    service.serviceType === "parking" ||
    service.serviceType === "hammock" ||
    service.serviceType === "rental";
  const isTimeBased =
    isSingleDayService ||
    service.priceUnit === "hour";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let startIso: string;
      let endIso: string;

      if (isAccommodation) {
        startIso = new Date(`${startDateStr}T14:00:00`).toISOString();
        endIso = new Date(`${endDateStr}T11:00:00`).toISOString();
      } else if (isActivity) {
        startIso = new Date(`${startDateStr}T${startTimeStr}:00`).toISOString();
        // default duration or 2 hours
        const durationMins = service.durationMinutes || 120;
        const endDateObj = new Date(
          new Date(`${startDateStr}T${startTimeStr}:00`).getTime() +
            durationMins * 60000,
        );
        endIso = endDateObj.toISOString();
      } else if (isSingleDayService) {
        startIso = new Date(`${startDateStr}T${startTimeStr}:00`).toISOString();
        endIso = new Date(`${startDateStr}T${endTimeStr}:00`).toISOString();
      } else {
        startIso = new Date(`${startDateStr}T${startTimeStr}:00`).toISOString();
        endIso = new Date(`${endDateStr}T${endTimeStr}:00`).toISOString();
      }

      const finalQty = typeof quantity === "number" && quantity >= 1 ? quantity : 1;

      const res = await createBooking({
        serviceId: service.id,
        startDate: startIso,
        endDate: endIso,
        quantity: finalQty,
        totalAmount: calculation.totalAmount,
        notes: notes.trim() || undefined,
      });

      if (res.error) {
        toast.error("Error al realizar la reserva", {
          description: res.error.message,
        });
        setIsSubmitting(false);
        return;
      }

      toast.success("¡Reserva realizada con éxito!", {
        description: `Tu reserva para "${service.name}" ha sido confirmada.`,
      });

      onOpenChange(false);
      router.push("/reservations");
    } catch (err) {
      console.error(err);
      toast.error("Ocurrió un error inesperado al procesar la reserva.");
      setIsSubmitting(false);
    }
  };

  const formattedPrice = formatCurrency;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs uppercase tracking-wide">
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
                <Label htmlFor="singleDate" className="text-xs font-semibold">
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
                  <Label htmlFor="startTime" className="text-xs font-semibold">
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
                  <Label htmlFor="endTime" className="text-xs font-semibold">
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
              <Label htmlFor="quantity" className="text-xs font-semibold">
                {isAccommodation
                  ? "Número de huéspedes"
                  : isActivity
                    ? "Número de participantes"
                    : "Cantidad / Cupos"}
              </Label>
              {service.maxCapacity && (
                <span className="text-xs text-muted-foreground">
                  Máximo: {service.maxCapacity}
                </span>
              )}
            </div>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={service.maxCapacity || 99}
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
                } else if (service.maxCapacity && quantity > service.maxCapacity) {
                  setQuantity(service.maxCapacity);
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
              Reserva instantánea y confirmación directa con el proveedor.
            </span>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
              {isSubmitting ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle2Icon className="mr-2 h-4 w-4" />
                  Confirmar Reserva
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
