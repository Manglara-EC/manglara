"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { endOfDay, isSameDay } from "date-fns";
import { CalendarIcon, HistoryIcon, ShoppingBagIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  getCustomerActivities,
  type CustomerActivity,
} from "@/features/services/actions/get-customer-bookings";
import { cancelBooking } from "@/features/services/actions/cancel-booking";
import { BookingTimelineEntry } from "@/features/services/components/customer-bookings/booking-timeline-entry";

type BookingView = "active" | "past";

export function CustomerBookingsList() {
  const [activities, setActivities] = useState<CustomerActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [bookingView, setBookingView] = useState<BookingView>("active");

  const fetchActivities = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const res = await getCustomerActivities();
    if (res.error) {
      setErrorMsg(res.error.message);
    } else if (res.data) {
      setActivities(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    void fetchActivities();
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
        setActivities((previousActivities) =>
          previousActivities.map((activity) =>
            activity.id === bookingId
              ? { ...activity, status: "cancelled" }
              : activity,
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
          <Button variant="outline" onClick={fetchActivities}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="border-dashed p-12 text-center">
        <CardContent className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <CalendarIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">No tienes actividades aún</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Explora los productos y servicios disponibles en Manglara.
            </p>
          </div>
          <Button asChild className="mt-2">
            <Link href="/explore">
              <ShoppingBagIcon className="mr-2 h-4 w-4" />
              Explorar Manglara
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const scheduledActivities = activities.filter(
    (activity) => activity.kind !== "product-purchase",
  );
  const purchases = activities
    .filter((activity) => activity.kind === "product-purchase")
    .toSorted(
      (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
    );
  const isPastActivity = (activity: CustomerActivity) => {
    if (activity.status === "cancelled") return true;
    if (!activity.startDate) return false;

    const endDate =
      activity.kind === "product-reservation"
        ? endOfDay(activity.startDate)
        : activity.endDate;

    return !!endDate && endDate < new Date();
  };
  const activeBookings = scheduledActivities
    .filter((activity) => !isPastActivity(activity))
    .toSorted(
      (left, right) => left.startDate!.getTime() - right.startDate!.getTime(),
    );
  const pastBookings = scheduledActivities
    .filter(isPastActivity)
    .toSorted(
      (left, right) => right.startDate!.getTime() - left.startDate!.getTime(),
    );
  const visibleBookings =
    bookingView === "active" ? activeBookings : pastBookings;

  return (
    <Tabs defaultValue="bookings" className="gap-6">
      <TabsList className="h-11 rounded-xl p-1">
        <TabsTrigger value="bookings" className="gap-2 px-4">
          <CalendarIcon className="h-4 w-4" />
          Reservas
          <span className="text-xs text-muted-foreground">
            {scheduledActivities.length}
          </span>
        </TabsTrigger>
        <TabsTrigger value="purchases" className="gap-2 px-4">
          <ShoppingBagIcon className="h-4 w-4" />
          Compras
          <span className="text-xs text-muted-foreground">
            {purchases.length}
          </span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="bookings" className="mt-0 space-y-5">
        <Tabs
          value={bookingView}
          onValueChange={(value) =>
            setBookingView(value === "past" ? "past" : "active")
          }
          className="gap-5"
        >
          <TabsList className="rounded-full bg-muted/50 p-1">
            <TabsTrigger value="active" className="rounded-full px-3">
              Próximas
              <span className="ml-1.5 text-xs text-muted-foreground">
                {activeBookings.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="past" className="rounded-full px-3">
              <HistoryIcon className="h-3.5 w-3.5" />
              Anteriores
              <span className="ml-1.5 text-xs text-muted-foreground">
                {pastBookings.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={bookingView} className="mt-0">
            {visibleBookings.length === 0 ? (
              <Card className="border-dashed py-10 text-center">
                <CardContent className="flex flex-col items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    {bookingView === "active" ? (
                      <CalendarIcon className="h-6 w-6 text-muted-foreground" />
                    ) : (
                      <HistoryIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold">
                      {bookingView === "active"
                        ? "No tienes reservas próximas"
                        : "No tienes reservas anteriores"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {bookingView === "active"
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
                    !isSameDay(booking.startDate!, previousBooking.startDate!);

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
          </TabsContent>
        </Tabs>
      </TabsContent>

      <TabsContent value="purchases" className="mt-0">
        {purchases.length === 0 ? (
          <Card className="border-dashed py-10 text-center">
            <CardContent className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <ShoppingBagIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">No tienes compras aún</h3>
                <p className="text-sm text-muted-foreground">
                  Los productos que compres sin una fecha de reserva aparecerán
                  aquí.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {purchases.map((purchase, index) => {
              const previousPurchase = purchases[index - 1];
              const showDate =
                !previousPurchase ||
                !isSameDay(purchase.createdAt, previousPurchase.createdAt);

              return (
                <BookingTimelineEntry
                  key={purchase.id}
                  booking={purchase}
                  showDate={showDate}
                  isPending={isPending}
                  cancellingId={cancellingId}
                  onCancel={handleCancelBooking}
                />
              );
            })}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
