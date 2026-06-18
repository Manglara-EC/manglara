import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowLeftIcon, Package, Wrench, UserIcon, BuildingIcon, CalendarIcon } from "lucide-react";

import { auth } from "@/shared/lib/better-auth/server";
import {
  TypographyH1,
  TypographyMuted,
  TypographyP,
} from "@/shared/components/ui/typography";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";

import { getItemForAdmin } from "@/features/admin/actions/get-item-for-admin";
import { ItemApprovalCard } from "@/features/admin/components/item-approval-card";

export const metadata: Metadata = {
  title: "Manglara | Revisar Item",
};

interface Props {
  params: Promise<{
    type: string;
    id: string;
  }>;
}

const STATUS_INFO: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendiente de revisión", variant: "outline" },
  approved: { label: "Aprobado", variant: "default" },
  rejected: { label: "Rechazado", variant: "destructive" },
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  accommodation: "Alojamiento",
  activity: "Actividad / Experiencia",
};

export default async function AdminItemDetailPage({ params }: Props) {
  const { type, id } = await params;
  
  // Validar tipo
  if (type !== "product" && type !== "service") {
    notFound();
  }

  // Verificar autenticación y rol admin
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role !== "admin") {
    redirect("/home");
  }

  // Obtener el item
  const { data: item, error } = await getItemForAdmin({
    itemId: id,
    itemType: type as "product" | "service",
  });

  if (error || !item) {
    notFound();
  }

  const statusInfo = STATUS_INFO[item.status] || STATUS_INFO.pending;
  const isProduct = item.type === "product";

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto py-6 pb-20 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/organizations">
                <ArrowLeftIcon className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                {isProduct ? (
                  <Package className="h-6 w-6 text-muted-foreground" />
                ) : (
                  <Wrench className="h-6 w-6 text-muted-foreground" />
                )}
                <TypographyH1>{item.name}</TypographyH1>
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              </div>
              <TypographyMuted>
                {isProduct ? "Producto" : "Servicio"} • ID: {item.id.slice(0, 8)}...
              </TypographyMuted>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Columna principal - Info del item */}
          <div className="space-y-6 lg:col-span-2">
            {/* Información básica */}
            <Card>
              <CardHeader>
                <CardTitle>Información del {isProduct ? "producto" : "servicio"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isProduct && item.serviceType && (
                  <div>
                    <TypographyMuted className="text-sm">Tipo de servicio</TypographyMuted>
                    <Badge variant="secondary" className="mt-1">
                      {SERVICE_TYPE_LABELS[item.serviceType] || item.serviceType}
                    </Badge>
                  </div>
                )}

                {item.description && (
                  <div>
                    <TypographyMuted className="text-sm">Descripción</TypographyMuted>
                    <TypographyP className="mt-1 whitespace-pre-wrap">{item.description}</TypographyP>
                  </div>
                )}

                {!isProduct && item.location && (
                  <div>
                    <TypographyMuted className="text-sm">Ubicación</TypographyMuted>
                    <TypographyP className="mt-1">{item.location}</TypographyP>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <TypographyMuted className="text-sm">Precio</TypographyMuted>
                    <p className="text-2xl font-bold mt-1">
                      ${item.price.toFixed(2)}
                      {item.priceUnit && (
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          / {item.priceUnit}
                        </span>
                      )}
                    </p>
                  </div>

                  {isProduct && item.stock !== undefined && (
                    <div>
                      <TypographyMuted className="text-sm">Stock disponible</TypographyMuted>
                      <p className="text-2xl font-bold mt-1">{item.stock}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Configuración del servicio (si aplica) */}
            {!isProduct && item.serviceConfig && Object.keys(item.serviceConfig).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Configuración del servicio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Información básica del config */}
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    {item.serviceConfig.maxCapacity && (
                      <div>
                        <dt className="text-muted-foreground">Capacidad máxima</dt>
                        <dd className="font-medium">{String(item.serviceConfig.maxCapacity)} personas</dd>
                      </div>
                    )}
                    {/* Campos de Alojamiento */}
                    {item.serviceConfig.checkInTime && (
                      <div>
                        <dt className="text-muted-foreground">Check-in</dt>
                        <dd className="font-medium">{String(item.serviceConfig.checkInTime)}</dd>
                      </div>
                    )}
                    {item.serviceConfig.checkOutTime && (
                      <div>
                        <dt className="text-muted-foreground">Check-out</dt>
                        <dd className="font-medium">{String(item.serviceConfig.checkOutTime)}</dd>
                      </div>
                    )}
                    {item.serviceConfig.minNights && (
                      <div>
                        <dt className="text-muted-foreground">Noches mínimas</dt>
                        <dd className="font-medium">{String(item.serviceConfig.minNights)}</dd>
                      </div>
                    )}
                    {item.serviceConfig.maxNights && (
                      <div>
                        <dt className="text-muted-foreground">Noches máximas</dt>
                        <dd className="font-medium">{String(item.serviceConfig.maxNights)}</dd>
                      </div>
                    )}
                    {item.serviceConfig.bedrooms && (
                      <div>
                        <dt className="text-muted-foreground">Habitaciones</dt>
                        <dd className="font-medium">{String(item.serviceConfig.bedrooms)}</dd>
                      </div>
                    )}
                    {item.serviceConfig.bathrooms && (
                      <div>
                        <dt className="text-muted-foreground">Baños</dt>
                        <dd className="font-medium">{String(item.serviceConfig.bathrooms)}</dd>
                      </div>
                    )}
                    {item.serviceConfig.beds && (
                      <div>
                        <dt className="text-muted-foreground">Camas</dt>
                        <dd className="font-medium">{String(item.serviceConfig.beds)}</dd>
                      </div>
                    )}
                    {/* Campos de Actividad */}
                    {item.serviceConfig.difficulty && (
                      <div>
                        <dt className="text-muted-foreground">Dificultad</dt>
                        <dd className="font-medium capitalize">{String(item.serviceConfig.difficulty)}</dd>
                      </div>
                    )}
                    {item.serviceConfig.minParticipants && (
                      <div>
                        <dt className="text-muted-foreground">Participantes mínimos</dt>
                        <dd className="font-medium">{String(item.serviceConfig.minParticipants)}</dd>
                      </div>
                    )}
                    {item.serviceConfig.meetingPoint && (
                      <div className="col-span-2">
                        <dt className="text-muted-foreground">Punto de encuentro</dt>
                        <dd className="font-medium">{String(item.serviceConfig.meetingPoint)}</dd>
                      </div>
                    )}
                  </dl>

                  {/* Amenidades (Alojamiento) */}
                  {Array.isArray(item.serviceConfig.amenities) && item.serviceConfig.amenities.length > 0 && (
                    <div>
                      <TypographyMuted className="text-sm mb-2">Amenidades</TypographyMuted>
                      <div className="flex flex-wrap gap-2">
                        {(item.serviceConfig.amenities as string[]).map((amenity, i) => (
                          <Badge key={i} variant="outline">{amenity}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reglas de la casa (Alojamiento) */}
                  {Array.isArray(item.serviceConfig.houseRules) && item.serviceConfig.houseRules.length > 0 && (
                    <div>
                      <TypographyMuted className="text-sm mb-2">Reglas de la casa</TypographyMuted>
                      <ul className="list-disc list-inside space-y-1">
                        {(item.serviceConfig.houseRules as string[]).map((rule, i) => (
                          <li key={i} className="text-sm">{rule}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Requisitos (Actividad) */}
                  {Array.isArray(item.serviceConfig.requirements) && item.serviceConfig.requirements.length > 0 && (
                    <div>
                      <TypographyMuted className="text-sm mb-2">Requisitos</TypographyMuted>
                      <ul className="list-disc list-inside space-y-1">
                        {(item.serviceConfig.requirements as string[]).map((req, i) => (
                          <li key={i} className="text-sm">{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Qué incluye (Actividad) */}
                  {Array.isArray(item.serviceConfig.inclusions) && item.serviceConfig.inclusions.length > 0 && (
                    <div>
                      <TypographyMuted className="text-sm mb-2">Qué incluye</TypographyMuted>
                      <div className="flex flex-wrap gap-2">
                        {(item.serviceConfig.inclusions as string[]).map((item, i) => (
                          <Badge key={i} variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            ✓ {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Qué NO incluye (Actividad) */}
                  {Array.isArray(item.serviceConfig.exclusions) && item.serviceConfig.exclusions.length > 0 && (
                    <div>
                      <TypographyMuted className="text-sm mb-2">Qué NO incluye</TypographyMuted>
                      <div className="flex flex-wrap gap-2">
                        {(item.serviceConfig.exclusions as string[]).map((item, i) => (
                          <Badge key={i} variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            ✗ {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Información del vendedor */}
            <Card>
              <CardHeader>
                <CardTitle>Información del vendedor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{item.sellerName}</p>
                    <p className="text-sm text-muted-foreground">{item.sellerEmail}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <BuildingIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{item.organizationName}</p>
                    <p className="text-sm text-muted-foreground">Organización</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna lateral - Acciones */}
          <div className="space-y-6">
            {/* Card de aprobación */}
            <ItemApprovalCard
              itemId={item.id}
              itemType={item.type}
              itemName={item.name}
              currentStatus={item.status}
              rejectionReason={item.rejectionReason}
            />

            {/* Fechas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Historial</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Creado</p>
                    <p className="font-medium">
                      {item.createdAt.toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {item.approvedAt && (
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">
                        {item.status === "approved" ? "Aprobado" : "Rechazado"}
                      </p>
                      <p className="font-medium">
                        {item.approvedAt.toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
