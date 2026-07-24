"use client";

import { AlertCircleIcon, ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";

import { useProduct } from "@/features/seller/hooks/use-product";
import { EditProductForm } from "./edit-product-form";

interface Props {
  productId: string;
}

export function EditProductFormWrapper({ productId }: Props) {
  const {
    data: product,
    isLoading,
    isError,
    error,
    refetch,
  } = useProduct(productId);

  if (isLoading) {
    return <EditProductFormSkeleton />;
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Error al cargar el producto</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error?.message || "Ocurrió un error inesperado"}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
        <Button variant="outline" asChild>
          <Link href="/seller/products">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Volver a mis productos
          </Link>
        </Button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Producto no encontrado</AlertTitle>
          <AlertDescription>
            El producto que buscas no existe o no tienes permiso para verlo.
          </AlertDescription>
        </Alert>
        <Button variant="outline" asChild>
          <Link href="/seller/products">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Volver a mis productos
          </Link>
        </Button>
      </div>
    );
  }

  return <EditProductForm productId={productId} product={product} />;
}

function EditProductFormSkeleton() {
  return (
    <div className="space-y-8">
      {/* Card - Información del producto */}
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
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
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
