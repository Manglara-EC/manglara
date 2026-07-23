import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getVisibleItems } from "@/features/items/actions/get-visible-items";
import type { ItemSearchParams } from "@/features/items/types";
import type { PaginationResponse } from "@/shared/schemas/pagination";

interface UsePaginatedItemsProps {
  params?: Omit<ItemSearchParams, "page" | "pageSize">;
  initialPageSize?: number;
}

interface UsePaginatedItemsReturn {
  items: ReturnType<typeof getVisibleItems> extends Promise<infer T>
    ? T extends { data: infer D }
      ? D extends { items: infer I }
        ? I
        : never
      : never
    : never;
  pagination: PaginationResponse | null;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

/**
 * Hook para manejar paginación de items
 * Mantiene el estado de la página actual y realiza queries automáticas
 *
 * @example
 * const { items, pagination, currentPage, setCurrentPage } = usePaginatedItems({
 *   params: { itemType: 'product' }
 * });
 */
export const usePaginatedItems = ({
  params,
  initialPageSize = 50,
}: UsePaginatedItemsProps): UsePaginatedItemsReturn => {
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["items", "paginated", params, currentPage, initialPageSize],
    queryFn: async () => {
      const { data: response, error: apiError } = await getVisibleItems({
        ...params,
        page: currentPage,
        pageSize: initialPageSize,
      });

      if (apiError) throw new Error(apiError.message);

      return response;
    },
  });

  return {
    items: data?.items ?? [],
    pagination: data?.pagination ?? null,
    currentPage,
    setCurrentPage,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
};
