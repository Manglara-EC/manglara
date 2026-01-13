"use client";

import { LoaderIcon, RotateCcwIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { TypographyH4 } from "@/shared/components/ui/typography";
import { Skeleton } from "@/shared/components/ui/skeleton";

import { useVisibleItems } from "@/features/items/hooks/use-visible-items";
import { ItemCard } from "@/features/items/components/item-card";
import type { ItemSearchParams } from "@/features/items/types";

interface Props {
  params?: ItemSearchParams;
}

export function ItemsGrid({ params }: Props) {
  const {
    data: items,
    isSuccess,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useVisibleItems({ params });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-4 rounded-xl border p-6">
            <Skeleton className="aspect-video w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">Algo salió mal al cargar los items 😢</p>
        <Button
          variant="outline"
          type="button"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          {isRefetching ? (
            <LoaderIcon className="animate-spin" />
          ) : (
            <RotateCcwIcon />
          )}
          Reintentar
        </Button>
      </div>
    );
  }

  if (isSuccess && (!items || items.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <TypographyH4 className="text-muted-foreground">
          No hay items disponibles
        </TypographyH4>
        <p className="text-sm text-muted-foreground">
          No se encontraron productos o servicios aprobados.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items?.map((item) => (
        <ItemCard key={`${item.type}-${item.id}`} item={item} />
      ))}
    </div>
  );
}

