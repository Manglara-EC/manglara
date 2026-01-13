"use client";

import { AlertCircleIcon, LoaderIcon, ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";

import { useService } from "@/features/seller/hooks/use-service";
import { EditServiceForm } from "@/features/seller/components/edit-service-form";

interface Props {
  serviceId: string;
}

export function EditServiceFormWrapper({ serviceId }: Props) {
  const { data: service, isLoading, isError, error, refetch } = useService(serviceId);

  if (isLoading) {
    return <EditServiceFormSkeleton />;
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Error al cargar el servicio</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error?.message || "Ocurrió un error inesperado"}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
        <Button variant="outline" asChild>
          <Link href="/seller/services">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Volver a mis servicios
          </Link>
        </Button>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Servicio no encontrado</AlertTitle>
          <AlertDescription>
            El servicio que buscas no existe o no tienes permiso para verlo.
          </AlertDescription>
        </Alert>
        <Button variant="outline" asChild>
          <Link href="/seller/services">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Volver a mis servicios
          </Link>
        </Button>
      </div>
    );
  }

  return <EditServiceForm serviceId={serviceId} service={service} />;
}

function EditServiceFormSkeleton() {
  return (
    <div className="space-y-8">
      {/* Card 1 - Información básica */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Card 2 - Precio y capacidad */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3 - Política de cancelación */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Botones */}
      <div className="flex justify-end gap-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}
