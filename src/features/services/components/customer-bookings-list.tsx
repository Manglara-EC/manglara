"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { isSameDay } from "date-fns";
import { CalendarIcon, HistoryIcon, ShoppingBagIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  getCustomerBookings,
  type CustomerBooking,
} from "@/features/services/actions/get-customer-bookings";
import { cancelBooking } from "@/features/services/actions/cancel-booking";
import { BookingTimelineEntry } from "@/features/services/components/customer-bookings/booking-timeline-entry";

type BookingView = "active" | "past";

export function CustomerBookingsList() {
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<BookingView>("active");

  const fetchBookings = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const res = await getCustomerBookings();
    if (res.error) {
      setErrorMsg(res.error.message);
    } else if (res.data) {
      setBookings(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    void fetchBookings();
  }, []);

  const handleCancelBooking = (bookingId: string) => {
    setCancellingId(bookingId);
    startTransition(async () => {
      const res = await cancelBooking(bookingId);
      if (res.error) {
        toast.error("Error al cancelar la reserva", {
          description: res.error.message,
        });
      } else {
        toast.success("Reserva cancelada correctamente");
        setBookings((previousBookings) =>
          previousBookings.map((booking) =>
            booking.id === bookingId
              ? { ...booking, status: "cancelled" }
              : booking,
          ),
        );
      }
      setCancellingId(null);
    });
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="p-4 pb-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="mt-1 h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              <Skeleton className="h-24 w-full rounded-md" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (errorMsg) {
    return (
      <Card className="border-dashed p-8 text-center">
        <CardContent className="space-y-3">
          <p className="font-medium text-destructive">{errorMsg}</p>
          <Button variant="outline" onClick={fetchBookings}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card className="border-dashed p-12 text-center">
        <CardContent className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <CalendarIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">No tienes reservas aún</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Explora los servicios disponibles en Manglara y realiza tu primera
              reserva.
            </p>
          </div>
          <Button asChild className="mt-2">
            <Link href="/explore">
              <ShoppingBagIcon className="mr-2 h-4 w-4" />
              Explorar servicios
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const now = new Date();
  const activeBookings = bookings
    .filter(
      (booking) =>
        booking.status !== "cancelled" && new Date(booking.startDate) >= now,
    )
    .toSorted(
      (left, right) =>
        new Date(left.startDate).getTime() -
        new Date(right.startDate).getTime(),
    );
  const pastBookings = bookings
    .filter(
      (booking) =>
        booking.status === "cancelled" || new Date(booking.startDate) < now,
    )
    .toSorted(
      (left, right) =>
        new Date(right.startDate).getTime() -
        new Date(left.startDate).getTime(),
    );
  const visibleBookings = view === "active" ? activeBookings : pastBookings;

  return (
    <div className="space-y-6">
      <div
        className="inline-flex rounded-full border bg-muted/50 p-1"
        role="tablist"
      >
        <Button
          type="button"
          variant={view === "active" ? "default" : "ghost"}
          size="sm"
          className="rounded-full"
          role="tab"
          aria-selected={view === "active"}
          onClick={() => setView("active")}
        >
          Activas
          <span className="ml-1.5 text-xs opacity-75">
            {activeBookings.length}
          </span>
        </Button>
        <Button
          type="button"
          variant={view === "past" ? "default" : "ghost"}
          size="sm"
          className="rounded-full"
          role="tab"
          aria-selected={view === "past"}
          onClick={() => setView("past")}
        >
          <HistoryIcon className="mr-1.5 h-3.5 w-3.5" />
          Anteriores
          <span className="ml-1.5 text-xs opacity-75">
            {pastBookings.length}
          </span>
        </Button>
      </div>

      {visibleBookings.length === 0 ? (
        <Card className="border-dashed py-10 text-center">
          <CardContent className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              {view === "active" ? (
                <CalendarIcon className="h-6 w-6 text-muted-foreground" />
              ) : (
                <HistoryIcon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold">
                {view === "active"
                  ? "No tienes reservas activas"
                  : "No tienes reservas anteriores"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {view === "active"
                  ? "Tus próximas reservas aparecerán aquí."
                  : "Tu historial de reservas aparecerá aquí."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {visibleBookings.map((booking, index) => {
            const previousBooking = visibleBookings[index - 1];
            const showDate =
              !previousBooking ||
              !isSameDay(
                new Date(booking.startDate),
                new Date(previousBooking.startDate),
              );

            return (
              <BookingTimelineEntry
                key={booking.id}
                booking={booking}
                showDate={showDate}
                isPending={isPending}
                cancellingId={cancellingId}
                onCancel={handleCancelBooking}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
