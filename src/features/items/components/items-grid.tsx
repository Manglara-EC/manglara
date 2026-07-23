"use client";

import { LoaderIcon, RotateCcwIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { TypographyH4 } from "@/shared/components/ui/typography";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Pagination } from "@/shared/components/pagination";

import { usePaginatedItems } from "@/features/items/hooks/use-paginated-items";
import { ItemCard } from "@/features/items/components/item-card";
import type { ItemSearchParams } from "@/features/items/types";

interface Props {
  params?: Omit<ItemSearchParams, "page" | "pageSize">;
  pageSize?: number;
}

export function ItemsGrid({ params, pageSize = 50 }: Props) {
  const {
    items,
    pagination,
    currentPage,
    setCurrentPage,
    isLoading,
    isError,
    refetch,
  } = usePaginatedItems({ params, initialPageSize: pageSize });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
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
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">
          Algo salió mal al cargar los items 😢
        </p>
        <Button variant="outline" type="button" onClick={() => refetch()}>
          <RotateCcwIcon />
          Reintentar
        </Button>
      </div>
    );
  }

  if (!items || items.length === 0) {
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
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <ItemCard key={`${item.type}-${item.id}`} item={item} />
        ))}
      </div>

      {pagination && (
        <Pagination
          pagination={pagination}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
