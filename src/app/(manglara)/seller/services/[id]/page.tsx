import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftIcon, EditIcon, ExternalLinkIcon } from "lucide-react";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import {
  TypographyH1,
  TypographyMuted,
  TypographyP,
} from "@/shared/components/ui/typography";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { service, organization, member } from "@/shared/lib/drizzle/schema";
import { 
  SERVICE_TYPE_LABELS, 
  PRICE_UNIT_LABELS, 
  CANCELLATION_POLICY_LABELS,
  type ServiceType,
  type PriceUnit,
} from "@/features/seller/types";

export const metadata: Metadata = {
  title: "Manglara | Detalle del Servicio",
};

interface Props {
  params: Promise<{
    id: string;
  }>;
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendiente", variant: "secondary" },
  approved: { label: "Aprobado", variant: "default" },
  rejected: { label: "Rechazado", variant: "destructive" },
};

export default async function ServiceDetailPage({ params }: Props) {
  const { id } = await params;
  
  // Verificar autenticación
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const userId = session.user.id;
  const userRole = session.user.role;

  // Obtener el servicio
  const serviceData = await db
    .select({
      id: service.id,
      name: service.name,
      description: service.description,
      organizationId: service.organizationId,
      price: service.price,
      priceUnit: service.priceUnit,
      serviceType: service.serviceType,
      location: service.location,
      serviceConfig: service.serviceConfig,
      availabilityRules: service.availabilityRules,
      cancellationPolicy: service.cancellationPolicy,
      sellerId: service.sellerId,
      status: service.status,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
      organizationName: organization.name,
      organizationSlug: organization.slug,
    })
    .from(service)
    .innerJoin(organization, eq(service.organizationId, organization.id))
    .where(eq(service.id, id))
    .limit(1);

  if (serviceData.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/seller/services">
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
          </Button>
          <TypographyH1>Servicio no encontrado</TypographyH1>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <TypographyMuted>
              El servicio que buscas no existe o fue eliminado.
            </TypographyMuted>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/seller/services">Volver a mis servicios</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const foundService = serviceData[0];

  // Verificar permisos
  const canView = userRole === "admin" || foundService.sellerId === userId;
  
  if (!canView) {
    // Verificar si es miembro de la organización
    const memberRecord = await db
      .select({ role: member.role })
      .from(member)
      .where(eq(member.organizationId, foundService.organizationId))
      .limit(1);

    if (memberRecord.length === 0) {
      redirect("/seller/services");
    }
  }

  const canEdit = userRole === "admin" || foundService.sellerId === userId;
  const statusInfo = STATUS_LABELS[foundService.status || "pending"];
  const config = (foundService.serviceConfig as Record<string, unknown>) ?? {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/seller/services">
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <TypographyH1>{foundService.name}</TypographyH1>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
            <TypographyMuted>
              {foundService.organizationName}
            </TypographyMuted>
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/services/${foundService.id}`}>
                <ExternalLinkIcon className="mr-2 h-4 w-4" />
                Ver página pública
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/seller/services/${foundService.id}/edit`}>
                <EditIcon className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna principal */}
        <div className="space-y-6 lg:col-span-2">
          {/* Información básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <TypographyMuted className="text-sm">Tipo de servicio</TypographyMuted>
                <Badge variant="outline" className="mt-1">
                  {SERVICE_TYPE_LABELS[foundService.serviceType as ServiceType] || "Otro"}
                </Badge>
              </div>
              
              {foundService.description && (
                <div>
                  <TypographyMuted className="text-sm">Descripción</TypographyMuted>
                  <TypographyP className="mt-1">{foundService.description}</TypographyP>
                </div>
              )}

              {foundService.location && (
                <div>
                  <TypographyMuted className="text-sm">Ubicación</TypographyMuted>
                  <TypographyP className="mt-1">{foundService.location}</TypographyP>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuración específica del tipo */}
          {Object.keys(config).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Configuración del servicio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Información general en grid */}
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  {Boolean(config.maxCapacity) && (
                    <div>
                      <dt className="text-muted-foreground">Capacidad máxima</dt>
                      <dd className="font-medium">{String(config.maxCapacity)} personas</dd>
                    </div>
                  )}
                  {Boolean(config.durationMinutes) && (
                    <div>
                      <dt className="text-muted-foreground">Duración</dt>
                      <dd className="font-medium">{String(config.durationMinutes)} minutos</dd>
                    </div>
                  )}
                  {Boolean(config.checkInTime) && (
                    <div>
                      <dt className="text-muted-foreground">Check-in</dt>
                      <dd className="font-medium">{String(config.checkInTime)}</dd>
                    </div>
                  )}
                  {Boolean(config.checkOutTime) && (
                    <div>
                      <dt className="text-muted-foreground">Check-out</dt>
                      <dd className="font-medium">{String(config.checkOutTime)}</dd>
                    </div>
                  )}
                  {Boolean(config.minNights) && (
                    <div>
                      <dt className="text-muted-foreground">Noches mínimas</dt>
                      <dd className="font-medium">{String(config.minNights)}</dd>
                    </div>
                  )}
                  {Boolean(config.maxNights) && (
                    <div>
                      <dt className="text-muted-foreground">Noches máximas</dt>
                      <dd className="font-medium">{String(config.maxNights)}</dd>
                    </div>
                  )}
                  {Boolean(config.bedrooms) && (
                    <div>
                      <dt className="text-muted-foreground">Habitaciones</dt>
                      <dd className="font-medium">{String(config.bedrooms)}</dd>
                    </div>
                  )}
                  {Boolean(config.bathrooms) && (
                    <div>
                      <dt className="text-muted-foreground">Baños</dt>
                      <dd className="font-medium">{String(config.bathrooms)}</dd>
                    </div>
                  )}
                  {Boolean(config.beds) && (
                    <div>
                      <dt className="text-muted-foreground">Camas</dt>
                      <dd className="font-medium">{String(config.beds)}</dd>
                    </div>
                  )}
                  {Boolean(config.difficulty) && (
                    <div>
                      <dt className="text-muted-foreground">Dificultad</dt>
                      <dd className="font-medium capitalize">{String(config.difficulty)}</dd>
                    </div>
                  )}
                  {Boolean(config.minParticipants) && (
                    <div>
                      <dt className="text-muted-foreground">Participantes mínimos</dt>
                      <dd className="font-medium">{String(config.minParticipants)}</dd>
                    </div>
                  )}
                  {Boolean(config.meetingPoint) && (
                    <div className="col-span-2">
                      <dt className="text-muted-foreground">Punto de encuentro</dt>
                      <dd className="font-medium">{String(config.meetingPoint)}</dd>
                    </div>
                  )}
                </dl>

                {/* Amenidades (Alojamiento) */}
                {Array.isArray(config.amenities) && config.amenities.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <TypographyMuted className="text-sm font-medium mb-2">Amenidades</TypographyMuted>
                      <div className="flex flex-wrap gap-2">
                        {(config.amenities as string[]).map((amenity) => (
                          <Badge key={amenity} variant="secondary">{amenity}</Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Reglas de la casa (Alojamiento) */}
                {Array.isArray(config.houseRules) && config.houseRules.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <TypographyMuted className="text-sm font-medium mb-2">Reglas de la casa</TypographyMuted>
                      <ul className="list-disc list-inside space-y-1">
                        {(config.houseRules as string[]).map((rule, i) => (
                          <li key={i} className="text-sm">{rule}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {/* Requisitos (Actividad) */}
                {Array.isArray(config.requirements) && config.requirements.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <TypographyMuted className="text-sm font-medium mb-2">Requisitos</TypographyMuted>
                      <ul className="list-disc list-inside space-y-1">
                        {(config.requirements as string[]).map((item, i) => (
                          <li key={i} className="text-sm">{item}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {/* Qué incluye (Actividad) */}
                {Array.isArray(config.inclusions) && config.inclusions.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <TypographyMuted className="text-sm font-medium mb-2">¿Qué incluye?</TypographyMuted>
                      <ul className="space-y-1">
                        {(config.inclusions as string[]).map((item, i) => (
                          <li key={i} className="text-sm flex items-center gap-2">
                            <span className="text-green-600">✓</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {/* Qué NO incluye (Actividad) */}
                {Array.isArray(config.exclusions) && config.exclusions.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <TypographyMuted className="text-sm font-medium mb-2">¿Qué NO incluye?</TypographyMuted>
                      <ul className="space-y-1">
                        {(config.exclusions as string[]).map((item, i) => (
                          <li key={i} className="text-sm flex items-center gap-2">
                            <span className="text-red-600">✗</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          {/* Precio */}
          <Card>
            <CardHeader>
              <CardTitle>Precio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${Number(foundService.price).toFixed(2)}
                <span className="text-base font-normal text-muted-foreground">
                  {" "}/ {PRICE_UNIT_LABELS[foundService.priceUnit as PriceUnit] || foundService.priceUnit}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Política de cancelación */}
          <Card>
            <CardHeader>
              <CardTitle>Política de cancelación</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">
                {CANCELLATION_POLICY_LABELS[foundService.cancellationPolicy as keyof typeof CANCELLATION_POLICY_LABELS] || "Flexible"}
              </Badge>
              {Boolean(config.cancellationWindowHours) && (
                <TypographyMuted className="mt-2 text-sm">
                  Se puede cancelar hasta {String(config.cancellationWindowHours)} horas antes
                </TypographyMuted>
              )}
            </CardContent>
          </Card>

          {/* Información adicional */}
          <Card>
            <CardHeader>
              <CardTitle>Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Creado</span>
                <span>{foundService.createdAt?.toLocaleDateString("es-ES")}</span>
              </div>
              {foundService.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Actualizado</span>
                  <span>{foundService.updatedAt.toLocaleDateString("es-ES")}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
