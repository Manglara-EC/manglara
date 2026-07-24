"use client";

import { ServicesTable } from "@/features/seller/components/services-table";
import { useMyServices } from "@/features/seller/hooks/use-my-services";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/shared/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

export function MyServicesList() {
  const {
    data: services,
    isLoading,
    isError,
    error,
    refetch,
  } = useMyServices();

  // Si hay un error pero parece ser que no hay datos, mostrar estado vacío en vez de error
  if (isError) {
    const errorMessage = error?.message || "";

    // Si el error indica un problema de datos/permisos, mostrar como estado vacío
    if (
      errorMessage.includes("obtener servicios") ||
      errorMessage.includes("No hay")
    ) {
      return <ServicesTable services={[]} isLoading={false} />;
    }

    // Solo mostrar error destructivo para errores reales de sistema
    return (
      <Alert variant="destructive">
        <AlertCircleIcon className="h-4 w-4" />
        <AlertTitle>Error al cargar servicios</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{errorMessage || "Ocurrió un error inesperado"}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return <ServicesTable services={services ?? []} isLoading={isLoading} />;
}
