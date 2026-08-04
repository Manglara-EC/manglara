import Link from "next/link";
import { ArrowRightIcon, Building2Icon, CheckCircle2Icon } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import type { CustomerBooking } from "@/features/services/actions/get-customer-bookings";
import { BookingCancelAction } from "@/features/services/components/customer-bookings/booking-cancel-action";
import { BookingDateColumn } from "@/features/services/components/customer-bookings/booking-date-column";
import { BookingDetails } from "@/features/services/components/customer-bookings/booking-details";
import { BookingNotes } from "@/features/services/components/customer-bookings/booking-notes";

const SERVICE_TYPE_LABELS: Record<string, string> = {
  accommodation: "Alojamiento",
  activity: "Actividad",
  parking: "Estacionamiento",
  rental: "Alquiler",
  hammock: "Hamacas",
  other: "Servicio",
};

interface BookingTimelineEntryProps {
  booking: CustomerBooking;
  showDate: boolean;
  isPending: boolean;
  cancellingId: string | null;
  onCancel: (bookingId: string) => void;
}

export function BookingTimelineEntry({
  booking,
  showDate,
  isPending,
  cancellingId,
  onCancel,
}: BookingTimelineEntryProps) {
  const isCancelled = booking.status === "cancelled";
  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);
  const isFuture = startDate > new Date();

  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-7">
      <BookingDateColumn startDate={startDate} showDate={showDate} />
      <div className="relative before:absolute before:-left-[11px] before:top-0 before:h-full before:w-px before:bg-border sm:before:-left-[15px]">
        <span
          className={`absolute -left-[18px] top-3 flex h-4 w-4 rounded-full border-4 border-background sm:-left-[22px] ${
            isCancelled ? "bg-muted-foreground" : "bg-primary"
          }`}
          aria-hidden="true"
        />
        <Card
          className={`overflow-hidden transition-colors ${
            isCancelled ? "border-muted opacity-75" : "hover:border-primary/50"
          }`}
        >
          <CardHeader className="flex flex-row items-start justify-between gap-2 bg-muted/30 px-3 py-2.5">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {SERVICE_TYPE_LABELS[booking.serviceType] || "Servicio"}
                </Badge>

                {isCancelled ? (
                  <Badge variant="destructive" className="text-xs">
                    Cancelada
                  </Badge>
                ) : (
                  <Badge
                    variant="default"
                    className="bg-emerald-600 text-xs hover:bg-emerald-700"
                  >
                    <CheckCircle2Icon className="mr-1 inline h-3 w-3" />
                    Confirmada
                  </Badge>
                )}
              </div>

              <Link
                href={`/services/${booking.serviceId}`}
                className="mt-1 block line-clamp-1 text-base font-bold hover:underline"
              >
                {booking.serviceName}
              </Link>

              {booking.sellerName && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Building2Icon className="h-3 w-3" />
                  {booking.sellerName}
                </p>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-2.5 px-3 py-3">
            <BookingDetails
              booking={booking}
              startDate={startDate}
              endDate={endDate}
            />
            {booking.notes && <BookingNotes notes={booking.notes} />}
          </CardContent>

          <div className="px-3 pb-3 pt-0">
            <Separator />
            <div className="flex justify-end gap-2 pt-2">
              <Button asChild variant="ghost" size="sm">
                <Link href={`/services/${booking.serviceId}`}>
                  Ver servicio
                  <ArrowRightIcon className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
              {!isCancelled && isFuture && (
                <BookingCancelAction
                  bookingId={booking.id}
                  serviceName={booking.serviceName}
                  isCancelling={cancellingId === booking.id}
                  isPending={isPending}
                  onCancel={onCancel}
                />
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
