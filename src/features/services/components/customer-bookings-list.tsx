"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon,
  CheckCircle2Icon,
  Loader2Icon,
  ShoppingBagIcon,
  Building2Icon,
  ArrowRightIcon,
  HistoryIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Separator } from "@/shared/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import {
  getCustomerBookings,
  type CustomerBooking,
} from "@/features/services/actions/get-customer-bookings";
import { cancelBooking } from "@/features/services/actions/cancel-booking";
import { formatCurrency } from "@/shared/utils/currency";

const SERVICE_TYPE_LABELS: Record<string, string> = {
  accommodation: "Alojamiento",
  activity: "Actividad",
  parking: "Estacionamiento",
  rental: "Alquiler",
  hammock: "Hamacas",
  other: "Servicio",
};

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
    fetchBookings();
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
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId ? { ...b, status: "cancelled" } : b,
          ),
        );
      }
      setCancellingId(null);
    });
  };

  const formattedCurrency = formatCurrency;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="p-4 pb-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-1" />
            </CardHeader>
            <CardContent className="p-4 space-y-3">
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
      <Card className="p-8 text-center border-dashed">
        <CardContent className="space-y-3">
          <p className="text-destructive font-medium">{errorMsg}</p>
          <Button variant="outline" onClick={fetchBookings}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card className="p-12 text-center border-dashed">
        <CardContent className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <CalendarIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">No tienes reservas aún</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
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
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
  const pastBookings = bookings
    .filter(
      (booking) =>
        booking.status === "cancelled" || new Date(booking.startDate) < now,
    )
    .toSorted(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
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
          {visibleBookings.map((booking) => {
            const isCancelled = booking.status === "cancelled";
            const startDateObj = new Date(booking.startDate);
            const endDateObj = new Date(booking.endDate);
            const isFuture = startDateObj > new Date();

            return (
              <div
                key={booking.id}
                className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-7"
              >
                <time
                  dateTime={startDateObj.toISOString()}
                  className="pt-2 text-right text-xs font-medium leading-relaxed text-muted-foreground"
                >
                  <span className="block capitalize text-sm font-semibold text-foreground">
                    {format(startDateObj, "dd MMM", { locale: es })}
                  </span>
                  <span className="block capitalize">
                    {format(startDateObj, "EEEE", { locale: es })}
                  </span>
                  <span className="block">{format(startDateObj, "HH:mm")}</span>
                </time>
                <div className="relative before:absolute before:-left-[11px] before:top-0 before:h-full before:w-px before:bg-border sm:before:-left-[15px]">
                  <span
                    className={`absolute -left-[18px] top-3 flex h-4 w-4 rounded-full border-4 border-background sm:-left-[22px] ${
                      isCancelled ? "bg-muted-foreground" : "bg-primary"
                    }`}
                    aria-hidden="true"
                  />
                  <Card
                    className={`overflow-hidden transition-colors ${
                      isCancelled
                        ? "border-muted opacity-75"
                        : "hover:border-primary/50"
                    }`}
                  >
                    <CardHeader className="flex flex-row items-start justify-between gap-2 bg-muted/30 p-4 pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {SERVICE_TYPE_LABELS[booking.serviceType] ||
                              "Servicio"}
                          </Badge>

                          {isCancelled ? (
                            <Badge variant="destructive" className="text-xs">
                              Cancelada
                            </Badge>
                          ) : (
                            <Badge
                              variant="default"
                              className="bg-emerald-600 hover:bg-emerald-700 text-xs"
                            >
                              <CheckCircle2Icon className="mr-1 h-3 w-3 inline" />
                              Confirmada
                            </Badge>
                          )}
                        </div>

                        <Link
                          href={`/services/${booking.serviceId}`}
                          className="font-bold text-base hover:underline line-clamp-1 block mt-1"
                        >
                          {booking.serviceName}
                        </Link>

                        {booking.sellerName && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building2Icon className="h-3 w-3" />
                            {booking.sellerName}
                          </p>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4 p-4">
                      {booking.serviceImage && (
                        <div className="relative h-36 w-full overflow-hidden rounded-md bg-muted sm:h-44">
                          <Image
                            src={booking.serviceImage}
                            alt={booking.serviceName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-foreground">
                          <CalendarIcon className="h-4 w-4 text-primary shrink-0" />
                          <span>
                            <strong className="font-semibold">Inicio:</strong>{" "}
                            {format(startDateObj, "dd 'de' MMM, yyyy - HH:mm", {
                              locale: es,
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-foreground">
                          <ClockIcon className="h-4 w-4 text-primary shrink-0" />
                          <span>
                            <strong className="font-semibold">Fin:</strong>{" "}
                            {format(endDateObj, "dd 'de' MMM, yyyy - HH:mm", {
                              locale: es,
                            })}
                          </span>
                        </div>

                        {booking.quantity && booking.quantity > 0 && (
                          <div className="flex items-center gap-2 text-foreground">
                            <UsersIcon className="h-4 w-4 text-primary shrink-0" />
                            <span>
                              <strong className="font-semibold">
                                Cantidad / Cupos:
                              </strong>{" "}
                              {booking.quantity}
                            </span>
                          </div>
                        )}

                        {booking.location && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPinIcon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{booking.location}</span>
                          </div>
                        )}
                      </div>

                      {booking.notes && (
                        <div className="p-2.5 rounded bg-muted/50 text-xs space-y-1">
                          <span className="font-semibold text-muted-foreground">
                            Notas:
                          </span>
                          <p className="italic">{booking.notes}</p>
                        </div>
                      )}
                    </CardContent>

                    <div className="space-y-3 p-4 pt-0">
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-muted-foreground block">
                            Total Pagado
                          </span>
                          <span className="font-bold text-lg text-primary">
                            {formattedCurrency(booking.totalAmount)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/services/${booking.serviceId}`}>
                              Ver servicio
                              <ArrowRightIcon className="ml-1.5 h-3.5 w-3.5" />
                            </Link>
                          </Button>

                          {!isCancelled && isFuture && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:bg-destructive/10 border-destructive/30"
                                  disabled={
                                    cancellingId === booking.id || isPending
                                  }
                                >
                                  {cancellingId === booking.id ? (
                                    <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    "Cancelar"
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    ¿Cancelar esta reserva?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    ¿Estás seguro de que deseas cancelar tu
                                    reserva para{" "}
                                    <strong>{booking.serviceName}</strong>? Esta
                                    acción actualizará el estado a cancelado.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    No, mantener
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleCancelBooking(booking.id)
                                    }
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Sí, cancelar reserva
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
