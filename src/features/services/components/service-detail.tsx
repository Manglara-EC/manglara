"use client";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import {
  TypographyH1,
  TypographyH3,
  TypographyMuted,
  TypographyP,
} from "@/shared/components/ui/typography";

import type { PublicService } from "@/features/services/types";

function AmenitiesCard({ amenities }: { amenities: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Amenidades</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {amenities.map((amenity, i) => (
            <Badge key={i} variant="secondary">{amenity}</Badge>
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
};

const PRICE_UNIT_LABELS: Record<string, string> = {
  night: "por noche",
  person: "por persona",
  day: "por día",
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

export function ServiceDetail({ service }: Props) {
  const price = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(Number(service.price));

  const imageUrl = service.images && service.images.length > 0 ? service.images[0] : null;
  const config = (service.serviceConfig as Record<string, unknown>) ?? {};
  const serviceType = service.serviceType || "other";

  const hasAccommodationAmenities = (
    serviceType === "accommodation" &&
    Array.isArray(config.amenities) &&
    (config.amenities as unknown[])?.length > 0
  ) as boolean;
  const hasAccommodationHouseRules = (
    serviceType === "accommodation" &&
    Array.isArray(config.houseRules) &&
    (config.houseRules as unknown[])?.length > 0
  ) as boolean;

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
                  <TypographyH1 className="text-2xl md:text-3xl">{service.name}</TypographyH1>
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
                  <TypographyH3 className="text-lg mb-2">Descripción</TypographyH3>
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
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta de precio y reserva */}
        <Card className="h-fit">
          <CardHeader>
            <div className="text-center">
              <span className="text-3xl font-bold">{price}</span>
              <TypographyMuted className="block">
                {PRICE_UNIT_LABELS[service.priceUnit || "flat_rate"]}
              </TypographyMuted>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Info rápida */}
            <div className="space-y-2 text-sm">
              {service.maxCapacity && service.maxCapacity > 1 && (
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Hasta {service.maxCapacity} personas</span>
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
            </div>

            <Separator />

            {/* Política de cancelación */}
            <div className="text-sm">
              <TypographyMuted className="font-medium">Cancelación</TypographyMuted>
              <p className="text-xs text-muted-foreground mt-1">
                {CANCELLATION_LABELS[service.cancellationPolicy || "flexible"]}
              </p>
            </div>

            <Button className="w-full" size="lg">
              Reservar ahora
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Detalles según tipo de servicio */}
      <div className="grid gap-6 lg:grid-cols-2">
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
                    <span>Hasta {String(config.maxCapacity)} huéspedes</span>
                  </div>
                )}
              </div>

              {Boolean(config.checkInTime || config.checkOutTime) && (
                <>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {Boolean(config.checkInTime) && (
                      <div>
                        <TypographyMuted className="text-xs">Check-in</TypographyMuted>
                        <p className="font-medium">{String(config.checkInTime)}</p>
                      </div>
                    )}
                    {Boolean(config.checkOutTime) && (
                      <div>
                        <TypographyMuted className="text-xs">Check-out</TypographyMuted>
                        <p className="font-medium">{String(config.checkOutTime)}</p>
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
                        <TypographyMuted className="text-xs">Estancia mínima</TypographyMuted>
                        <p className="font-medium">{String(config.minNights)} noches</p>
                      </div>
                    )}
                    {Boolean(config.maxNights) && (
                      <div>
                        <TypographyMuted className="text-xs">Estancia máxima</TypographyMuted>
                        <p className="font-medium">{String(config.maxNights)} noches</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Alojamiento: Amenidades */}
        {false ? <AmenitiesCard amenities={(config.amenities as string[]) ?? []} /> : null}

        {/* Alojamiento: Reglas de la casa */}
        {false ? <HouseRulesCard houseRules={(config.houseRules as string[]) ?? []} /> : null}

        {/* Actividad: Detalles - Mostrar si hay datos de actividad o si es tipo activity */}
        {(serviceType === "activity" || Boolean(config.difficulty) || Boolean(config.minParticipants) || Boolean(config.meetingPoint)) && (
          <Card>
            <CardHeader>
              <CardTitle>Detalles de la actividad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {Boolean(config.difficulty) && (
                  <div>
                    <TypographyMuted className="text-xs">Dificultad</TypographyMuted>
                    <Badge variant="outline" className="mt-1">
                      {DIFFICULTY_LABELS[config.difficulty as string] || (config.difficulty as string)}
                    </Badge>
                  </div>
                )}
                {Boolean(config.minParticipants) && (
                  <div>
                    <TypographyMuted className="text-xs">Participantes mínimos</TypographyMuted>
                    <p className="font-medium">{String(config.minParticipants)}</p>
                  </div>
                )}
                {service.maxCapacity && (
                  <div>
                    <TypographyMuted className="text-xs">Capacidad máxima</TypographyMuted>
                    <p className="font-medium">{service.maxCapacity} personas</p>
                  </div>
                )}
                {service.durationMinutes && (
                  <div>
                    <TypographyMuted className="text-xs">Duración</TypographyMuted>
                    <p className="font-medium">{service.durationMinutes} minutos</p>
                  </div>
                )}
              </div>

              {Boolean(config.meetingPoint) && (
                <>
                  <Separator />
                  <div>
                    <TypographyMuted className="text-xs">Punto de encuentro</TypographyMuted>
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
        {Boolean(Array.isArray(config.requirements) && (config.requirements as unknown[]).length > 0) && (
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
        {Boolean(Array.isArray(config.inclusions) && (config.inclusions as unknown[]).length > 0) && (
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
        {Boolean(Array.isArray(config.exclusions) && (config.exclusions as unknown[]).length > 0) && (
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
