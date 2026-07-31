"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeftIcon,
  Wrench,
  MapPinIcon,
  ClockIcon,
  UsersIcon,
  CalendarIcon,
  BedDoubleIcon,
  BathIcon,
  HomeIcon,
} from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { MapPreview } from "@/shared/components/map-preview";
import {
  TypographyH1,
  TypographyH3,
  TypographyMuted,
  TypographyP,
} from "@/shared/components/ui/typography";
import { ServiceBookingDialog } from "@/features/services/components/service-booking-dialog";
import { formatCurrency } from "@/shared/utils/currency";

import type { PublicService } from "@/features/services/types";
import type { AvailabilityRules } from "@/shared/lib/drizzle/schema";

function AmenitiesCard({ amenities }: { amenities: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Amenidades</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {amenities.map((amenity, i) => (
            <Badge key={i} variant="secondary">
              {amenity}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function HouseRulesCard({ houseRules }: { houseRules: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reglas de la casa</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {houseRules.map((rule, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="text-muted-foreground">•</span>
              {rule}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

interface Props {
  service: PublicService;
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  accommodation: "Alojamiento",
  activity: "Actividad o experiencia",
  rental: "Alquiler de equipos",
};

const PRICE_UNIT_LABELS: Record<string, string> = {
  night: "por noche",
  person: "por persona",
  day: "por día completo (hasta el atardecer)",
  hour: "por hora",
  flat_rate: "tarifa fija",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Fácil",
  moderate: "Moderado",
  challenging: "Desafiante",
  expert: "Experto",
};

const CANCELLATION_LABELS: Record<string, string> = {
  flexible: "Flexible - Reembolso completo hasta 24h antes",
  moderate: "Moderada - Reembolso completo hasta 5 días antes",
  strict: "Estricta - Reembolso del 50% hasta 7 días antes",
};

const getScheduleText = (
  rules: AvailabilityRules | null | undefined,
): string => {
  if (!rules?.schedule) return "";
  const schedule = rules.schedule as Record<
    string,
    { start: string; end: string }[] | undefined
  >;
  const activeDays = Object.keys(schedule).filter(
    (day) => Array.isArray(schedule[day]) && (schedule[day]?.length ?? 0) > 0,
  );
  if (activeDays.length === 0) return "";

  const dayNames: Record<string, string> = {
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miércoles",
    thursday: "Jueves",
    friday: "Viernes",
    saturday: "Sábado",
    sunday: "Domingo",
  };

  const firstDay = activeDays[0];
  const slots = schedule[firstDay];
  const slot = slots ? slots[0] : null;
  const timeStr = slot ? ` de ${slot.start} a ${slot.end}` : "";

  if (activeDays.length === 7) {
    return `Todos los días${timeStr}`;
  }

  const isWeekdays =
    activeDays.length === 5 &&
    ["monday", "tuesday", "wednesday", "thursday", "friday"].every((d) =>
      activeDays.includes(d),
    );
  if (isWeekdays) {
    return `Lunes a Viernes${timeStr}`;
  }

  const names = activeDays.map((d) => dayNames[d] || d).join(", ");
  return `${names}${timeStr}`;
};

export function ServiceDetail({ service }: Props) {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const price = formatCurrency(service.price);

  interface ServiceConfigProps {
    pricingMode?: string;
    dailyPrice?: string;
    hourlyPrice?: string;
    maxCapacity?: number;
    maxNights?: number;
    minParticipants?: number;
    amenities?: string[];
    houseRules?: string[];
    minNights?: number;
    checkInTime?: string;
    checkOutTime?: string;
    bedrooms?: number;
    bathrooms?: number;
    beds?: number;
    difficulty?: string;
    requirements?: string[];
    inclusions?: string[];
    exclusions?: string[];
    meetingPoint?: string;
    allowedVehicles?: ("car" | "motorcycle" | "bicycle" | "bus")[];
    isRoofed?: boolean;
    hasSecurity?: boolean;
    hasCameras?: boolean;
    isGated?: boolean;
    surfaceType?: string;
  }

  const imageUrl =
    service.images && service.images.length > 0 ? service.images[0] : null;
  const config = ((service.serviceConfig as Record<string, unknown>) ??
    {}) as ServiceConfigProps;
  const serviceType = service.serviceType || "other";

  const hasAccommodationAmenities = (serviceType === "accommodation" &&
    Array.isArray(config.amenities) &&
    (config.amenities as unknown[])?.length > 0) as boolean;
  const hasAccommodationHouseRules = (serviceType === "accommodation" &&
    Array.isArray(config.houseRules) &&
    (config.houseRules as unknown[])?.length > 0) as boolean;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/explore">
        <Button variant="ghost" size="sm" className="w-fit">
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Volver a explorar
        </Button>
      </Link>

      {/* Header con imagen y info básica */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Imagen */}
        <Card className="lg:col-span-2">
          <CardHeader className="p-0">
            <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={service.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Wrench className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <TypographyH1 className="text-2xl md:text-3xl">
                    {service.name}
                  </TypographyH1>
                  <TypographyMuted className="text-sm">
                    Por {service.sellerName} · {service.organizationName}
                  </TypographyMuted>
                </div>
                <Badge variant="secondary">
                  {SERVICE_TYPE_LABELS[serviceType]}
                </Badge>
              </div>

              {service.description && (
                <div>
                  <TypographyH3 className="text-lg mb-2">
                    Descripción
                  </TypographyH3>
                  <TypographyP className="whitespace-pre-wrap text-muted-foreground">
                    {service.description}
                  </TypographyP>
                </div>
              )}

              {service.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPinIcon className="h-4 w-4" />
                  {service.location}
                </div>
              )}

              <MapPreview
                latitude={service.latitude}
                longitude={service.longitude}
                label={service.location}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta de precio y reserva */}
        <Card className="h-fit">
          <CardHeader>
            <div className="text-center">
              {serviceType === "rental" ? (
                <div>
                  <span className="text-3xl font-bold">{price}</span>
                  <TypographyMuted className="block">
                    {PRICE_UNIT_LABELS["hour"]}
                  </TypographyMuted>
                  {config.pricingMode === "daily" && config.dailyPrice && (
                    <Badge
                      variant="secondary"
                      className="mt-2 text-xs font-semibold"
                    >
                      O bien{" "}
                      {new Intl.NumberFormat("es-ES", {
                        style: "currency",
                        currency: "EUR",
                      }).format(Number(config.dailyPrice))}{" "}
                      por día completo
                    </Badge>
                  )}
                </div>
              ) : serviceType === "parking" ? (
                <div>
                  {config.hourlyPrice ? (
                    <div>
                      <span className="text-3xl font-bold">
                        {new Intl.NumberFormat("es-ES", {
                          style: "currency",
                          currency: "EUR",
                        }).format(Number(config.hourlyPrice))}
                      </span>
                      <TypographyMuted className="block">
                        por hora
                      </TypographyMuted>
                      {config.dailyPrice && (
                        <Badge
                          variant="secondary"
                          className="mt-2 text-xs font-semibold"
                        >
                          O bien{" "}
                          {new Intl.NumberFormat("es-ES", {
                            style: "currency",
                            currency: "EUR",
                          }).format(Number(config.dailyPrice))}{" "}
                          por día completo
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div>
                      <span className="text-3xl font-bold">
                        {new Intl.NumberFormat("es-ES", {
                          style: "currency",
                          currency: "EUR",
                        }).format(Number(config.dailyPrice))}
                      </span>
                      <TypographyMuted className="block">
                        por día completo
                      </TypographyMuted>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <span className="text-3xl font-bold">{price}</span>
                  <TypographyMuted className="block">
                    {PRICE_UNIT_LABELS[service.priceUnit || "flat_rate"]}
                  </TypographyMuted>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Info rápida */}
            <div className="space-y-2 text-sm">
              {serviceType === "rental" ? (
                <>
                  {service.maxCapacity && (
                    <div className="flex items-center gap-2">
                      <UsersIcon className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {service.maxCapacity}{" "}
                         {service.maxCapacity === 1 ? "hamaca" : "hamacas"}{" "}
                         de capacidad total
                      </span>
                    </div>
                  )}
                  {getScheduleText(service.availabilityRules) && (
                    <div className="flex items-start gap-2">
                      <ClockIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>
                        <span className="font-semibold block text-xs">
                          Horario de atención:
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {getScheduleText(service.availabilityRules)}
                        </span>
                      </span>
                    </div>
                  )}
                </>
              ) : serviceType === "parking" ? (
                <>
                  {service.maxCapacity && (
                    <div className="flex items-center gap-2">
                      <UsersIcon className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {service.maxCapacity}{" "}
                         {service.maxCapacity === 1
                           ? "plaza de parqueo"
                           : "plazas de parqueo"}{" "}
                         de capacidad total
                      </span>
                    </div>
                  )}
                  {getScheduleText(service.availabilityRules) && (
                    <div className="flex items-start gap-2">
                      <ClockIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>
                        <span className="font-semibold block text-xs">
                          Horario del estacionamiento:
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {getScheduleText(service.availabilityRules)}
                        </span>
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {service.maxCapacity && service.maxCapacity > 1 && (
                    <div className="flex items-center gap-2">
                      <UsersIcon className="h-4 w-4 text-muted-foreground" />
                       <span>Capacidad total: {service.maxCapacity} personas</span>
                    </div>
                  )}
                  {service.durationMinutes && (
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{service.durationMinutes} minutos</span>
                    </div>
                  )}
                  {Boolean(config.minNights) && (
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span>Mín. {String(config.minNights)} noches</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <Separator />

            {/* Política de cancelación */}
            <div className="text-sm">
              <TypographyMuted className="font-medium">
                Cancelación
              </TypographyMuted>
              <p className="text-xs text-muted-foreground mt-1">
                {CANCELLATION_LABELS[service.cancellationPolicy || "flexible"]}
              </p>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => setIsBookingOpen(true)}
            >
              {serviceType === "rental"
                ? "Alquilar ahora"
                : serviceType === "parking"
                  ? "Reservar plaza"
                  : "Reservar ahora"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <ServiceBookingDialog
        service={service}
        open={isBookingOpen}
        onOpenChange={setIsBookingOpen}
      />

      {/* Detalles según tipo de servicio */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Estacionamiento: Características específicas */}
        {serviceType === "parking" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Características del Estacionamiento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Vehículos permitidos */}
              {Array.isArray(config.allowedVehicles) &&
                config.allowedVehicles.length > 0 && (
                  <div>
                    <TypographyMuted className="text-sm font-medium mb-2">
                      Vehículos permitidos
                    </TypographyMuted>
                    <div className="flex flex-wrap gap-2">
                      {config.allowedVehicles.map((vehicle) => {
                        const labels: Record<string, string> = {
                          car: "🚗 Carros/SUVs",
                          motorcycle: "🏍️ Motocicletas",
                          bicycle: "🚲 Bicicletas",
                          bus: "🚌 Buses/Pesados",
                        };
                        return (
                          <Badge
                            key={vehicle}
                            variant="secondary"
                            className="px-3 py-1"
                          >
                            {labels[vehicle] || vehicle}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

              <Separator />

              {/* Características de seguridad e infraestructura */}
              <div>
                <TypographyMuted className="text-sm font-medium mb-2">
                  Seguridad e Infraestructura
                </TypographyMuted>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        config.isRoofed
                          ? "text-green-600 font-bold"
                          : "text-muted-foreground"
                      }
                    >
                      {config.isRoofed ? "✓ Techado / Sombra" : "✗ Sin techo"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        config.hasSecurity
                          ? "text-green-600 font-bold"
                          : "text-muted-foreground"
                      }
                    >
                      {config.hasSecurity
                        ? "✓ Vigilante físico"
                        : "✗ Sin vigilancia física"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        config.hasCameras
                          ? "text-green-600 font-bold"
                          : "text-muted-foreground"
                      }
                    >
                      {config.hasCameras ? "✓ Cámaras CCTV" : "✗ Sin cámaras"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        config.isGated
                          ? "text-green-600 font-bold"
                          : "text-muted-foreground"
                      }
                    >
                      {config.isGated ? "✓ Lote cerrado / Rejas" : "✗ Abierto"}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Tipo de Suelo */}
              {config.surfaceType && (
                <div>
                  <TypographyMuted className="text-sm font-medium mb-1">
                    Superficie del Suelo
                  </TypographyMuted>
                  <span className="text-sm font-semibold capitalize">
                    {config.surfaceType === "paved"
                      ? "Asfaltado / Pavimentado"
                      : config.surfaceType === "dirt"
                        ? "Tierra / Grava"
                        : "Arena"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Alojamiento: Características */}
        {serviceType === "accommodation" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HomeIcon className="h-5 w-5" />
                Características del alojamiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {Boolean(config.bedrooms) && (
                  <div className="flex items-center gap-2">
                    <BedDoubleIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{String(config.bedrooms)} habitaciones</span>
                  </div>
                )}
                {Boolean(config.bathrooms) && (
                  <div className="flex items-center gap-2">
                    <BathIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{String(config.bathrooms)} baños</span>
                  </div>
                )}
                {Boolean(config.beds) && (
                  <div className="flex items-center gap-2">
                    <BedDoubleIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{String(config.beds)} camas</span>
                  </div>
                )}
                {Boolean(config.maxCapacity) && (
                  <div className="flex items-center gap-2">
                    <UsersIcon className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Capacidad total: {String(config.maxCapacity)} huéspedes
                    </span>
                  </div>
                )}
              </div>

              {Boolean(config.checkInTime || config.checkOutTime) && (
                <>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {Boolean(config.checkInTime) && (
                      <div>
                        <TypographyMuted className="text-xs">
                          Check-in
                        </TypographyMuted>
                        <p className="font-medium">
                          {String(config.checkInTime)}
                        </p>
                      </div>
                    )}
                    {Boolean(config.checkOutTime) && (
                      <div>
                        <TypographyMuted className="text-xs">
                          Check-out
                        </TypographyMuted>
                        <p className="font-medium">
                          {String(config.checkOutTime)}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {Boolean(config.minNights || config.maxNights) && (
                <>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {Boolean(config.minNights) && (
                      <div>
                        <TypographyMuted className="text-xs">
                          Estancia mínima
                        </TypographyMuted>
                        <p className="font-medium">
                          {String(config.minNights)} noches
                        </p>
                      </div>
                    )}
                    {Boolean(config.maxNights) && (
                      <div>
                        <TypographyMuted className="text-xs">
                          Estancia máxima
                        </TypographyMuted>
                        <p className="font-medium">
                          {String(config.maxNights)} noches
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Alojamiento: Amenidades */}
        {false ? (
          <AmenitiesCard amenities={(config.amenities as string[]) ?? []} />
        ) : null}

        {/* Alojamiento: Reglas de la casa */}
        {false ? (
          <HouseRulesCard houseRules={(config.houseRules as string[]) ?? []} />
        ) : null}

        {/* Actividad: Detalles - Mostrar si hay datos de actividad o si es tipo activity */}
        {(serviceType === "activity" ||
          Boolean(config.difficulty) ||
          Boolean(config.minParticipants) ||
          Boolean(config.meetingPoint)) && (
          <Card>
            <CardHeader>
              <CardTitle>Detalles de la actividad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {Boolean(config.difficulty) && (
                  <div>
                    <TypographyMuted className="text-xs">
                      Dificultad
                    </TypographyMuted>
                    <Badge variant="outline" className="mt-1">
                      {DIFFICULTY_LABELS[config.difficulty as string] ||
                        (config.difficulty as string)}
                    </Badge>
                  </div>
                )}
                {Boolean(config.minParticipants) && (
                  <div>
                    <TypographyMuted className="text-xs">
                      Participantes mínimos
                    </TypographyMuted>
                    <p className="font-medium">
                      {String(config.minParticipants)}
                    </p>
                  </div>
                )}
                {service.maxCapacity && (
                  <div>
                    <TypographyMuted className="text-xs">
                       Capacidad total
                    </TypographyMuted>
                    <p className="font-medium">
                      {service.maxCapacity} personas
                    </p>
                  </div>
                )}
                {service.durationMinutes && (
                  <div>
                    <TypographyMuted className="text-xs">
                      Duración
                    </TypographyMuted>
                    <p className="font-medium">
                      {service.durationMinutes} minutos
                    </p>
                  </div>
                )}
              </div>

              {Boolean(config.meetingPoint) && (
                <>
                  <Separator />
                  <div>
                    <TypographyMuted className="text-xs">
                      Punto de encuentro
                    </TypographyMuted>
                    <p className="text-sm flex items-center gap-2 mt-1">
                      <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                      {String(config.meetingPoint)}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actividad: Requisitos - Mostrar si hay datos */}
        {Boolean(
          Array.isArray(config.requirements) &&
            (config.requirements as unknown[]).length > 0,
        ) && (
          <Card>
            <CardHeader>
              <CardTitle>Requisitos</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(config.requirements as string[]).map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-amber-600">⚠</span>
                    {req}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Actividad: Qué incluye - Mostrar si hay datos */}
        {Boolean(
          Array.isArray(config.inclusions) &&
            (config.inclusions as unknown[]).length > 0,
        ) && (
          <Card>
            <CardHeader>
              <CardTitle>¿Qué incluye?</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(config.inclusions as string[]).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-green-600">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Actividad: Qué NO incluye - Mostrar si hay datos */}
        {Boolean(
          Array.isArray(config.exclusions) &&
            (config.exclusions as unknown[]).length > 0,
        ) && (
          <Card>
            <CardHeader>
              <CardTitle>¿Qué NO incluye?</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(config.exclusions as string[]).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-red-600">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Servicio basado en tiempo */}
      </div>
    </div>
  );
}
