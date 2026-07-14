"use client";

import { ProductsTable } from "./products-table";
import { useMyProducts } from "@/features/seller/hooks/use-my-products";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

export function MyProductsList() {
  const { data: products, isLoading, isError, error, refetch } = useMyProducts();

  // Si hay un error pero parece ser que no hay datos, mostrar estado vacío en vez de error
  if (isError) {
    const errorMessage = error?.message || "";

    // Si el error indica un problema de datos/permisos, mostrar como estado vacío
    if (errorMessage.includes("obtener productos") || errorMessage.includes("No hay")) {
      return <ProductsTable products={[]} isLoading={false} />;
    }

    // Solo mostrar error destructivo para errores reales de sistema
    return (
      <Alert variant="destructive">
        <AlertCircleIcon className="h-4 w-4" />
        <AlertTitle>Error al cargar productos</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{errorMessage || "Ocurrió un error inesperado"}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return <ProductsTable products={products ?? []} isLoading={isLoading} />;
}
