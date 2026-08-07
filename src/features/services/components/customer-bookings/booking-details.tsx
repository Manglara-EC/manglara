import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, ClockIcon, MapPinIcon, UsersIcon } from "lucide-react";

import type { CustomerActivity } from "@/features/services/actions/get-customer-bookings";

interface BookingDetailsProps {
  booking: CustomerActivity;
  startDate: Date;
  endDate?: Date;
}

export function BookingDetails({
  booking,
  startDate,
  endDate,
}: BookingDetailsProps) {
  const isService = booking.kind === "service";
  const isProductReservation = booking.kind === "product-reservation";

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2 text-foreground">
        <CalendarIcon className="h-4 w-4 shrink-0 text-primary" />
        <span>
          <strong className="font-semibold">
            {isService
              ? "Inicio:"
              : isProductReservation
                ? "Fecha reservada:"
                : "Comprado:"}
          </strong>{" "}
          {format(
            startDate,
            isProductReservation
              ? "dd 'de' MMM, yyyy"
              : "dd 'de' MMM, yyyy - HH:mm",
            { locale: es },
          )}
        </span>
      </div>

      {isService && endDate && (
        <div className="flex items-center gap-2 text-foreground">
          <ClockIcon className="h-4 w-4 shrink-0 text-primary" />
          <span>
            <strong className="font-semibold">Fin:</strong>{" "}
            {format(endDate, "dd 'de' MMM, yyyy - HH:mm", { locale: es })}
          </span>
        </div>
      )}

      {booking.quantity > 0 && (
        <div className="flex items-center gap-2 text-foreground">
          <UsersIcon className="h-4 w-4 shrink-0 text-primary" />
          <span>
            <strong className="font-semibold">
              {isService ? "Cantidad / Cupos:" : "Cantidad:"}
            </strong>{" "}
            {booking.quantity}
          </span>
        </div>
      )}

      {booking.location && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPinIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">Ubicación: {booking.location}</span>
        </div>
      )}
    </div>
  );
}
