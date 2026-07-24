"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import type { PaginationResponse } from "@/shared/schemas/pagination";

interface PaginationProps {
  pagination: PaginationResponse;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

/**
 * Componente reutilizable de paginación
 * Muestra controles para navegar entre páginas
 *
 * @example
 * <Pagination
 *   pagination={paginationData}
 *   onPageChange={setCurrentPage}
 *   isLoading={isLoading}
 * />
 */
export function Pagination({
  pagination,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  const { page, totalPages, hasPreviousPage, hasNextPage } = pagination;

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {/* Botón primera página */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(1)}
        disabled={!hasPreviousPage || isLoading}
        title="Primera página"
      >
        <ChevronsLeftIcon className="h-4 w-4" />
      </Button>

      {/* Botón página anterior */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPreviousPage || isLoading}
        title="Página anterior"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>

      {/* Indicador de página */}
      <div className="flex items-center gap-2 px-4">
        <span className="text-sm font-medium">
          Página <span className="font-bold">{page}</span> de{" "}
          <span className="font-bold">{totalPages || 1}</span>
        </span>
      </div>

      {/* Botón página siguiente */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNextPage || isLoading}
        title="Página siguiente"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>

      {/* Botón última página */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(totalPages)}
        disabled={!hasNextPage || isLoading || totalPages === 0}
        title="Última página"
      >
        <ChevronsRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
