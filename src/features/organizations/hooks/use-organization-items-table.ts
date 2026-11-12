import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { getOrganizationItems } from "@/features/organizations/actions/get-organization-items";
import { getOrganizationItemsColumns } from "@/features/organizations/components/organization-items-table-columns";
import type { OrganizationItem } from "@/features/organizations/types";

interface Props {
  organizationId: string;
}

export const useOrganizationItemsTable = ({ organizationId }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data, isSuccess, isLoading, isError, refetch, isRefetching } =
    useQuery({
      queryKey: ["organization", organizationId, "items", pagination],
      queryFn: async () => {
        const { data, error } = await getOrganizationItems(organizationId);

        if (error) return Promise.reject(error);

        return data;
      },
    });

  const defaultData = useMemo(() => [], []);

  // El servidor decide el alcance: `all` (administración) u `own` (vendedor)
  const isSellerView = data?.scope === "own";
  const canModerate = data?.canModerate ?? false;

  const columns = useMemo(
    () => getOrganizationItemsColumns(isSellerView, canModerate),
    [isSellerView, canModerate],
  );

  const table = useReactTable({
    data: (data?.items as OrganizationItem[]) ?? defaultData,
    columns,
    rowCount: data?.items.length ?? 0,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      pagination,
    },
    getRowId: (row) => `${row.type}-${row.id}`,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination: false,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return {
    table,
    isSuccess,
    isLoading,
    isError,
    refetch,
    isRefetching,
    pagination,
  };
};
