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

import { useSession } from "@/shared/hooks/use-session";

import { getOrganizationItems } from "@/features/organizations/actions/get-organization-items";
import { getOrganizationItemsColumns } from "@/features/organizations/components/organization-items-table-columns";
import type { OrganizationItem } from "@/features/organizations/types";

interface Props {
  organizationId: string;
}

export const useOrganizationItemsTable = ({ organizationId }: Props) => {
  const { data: session } = useSession();
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
      queryFn: async ({ signal }) => {
        const { data, error } = await getOrganizationItems(organizationId);

        if (error) return Promise.reject(error);

        return data ?? [];
      },
    });

  const defaultData = useMemo(() => [], []);
  
  // Determine if user is seller (not admin) - sellers see statistics
  const isSeller = session?.user.role !== "admin" && data && data.length > 0 && "sales" in (data[0] ?? {});
  const columns = useMemo(() => getOrganizationItemsColumns(isSeller ?? false), [isSeller]);

  const table = useReactTable({
    data: (data as OrganizationItem[]) ?? defaultData,
    columns,
    rowCount: data?.length ?? 0,
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
