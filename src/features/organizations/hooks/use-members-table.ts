import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ColumnDef,
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

import { listOrganizationMembers } from "@/features/organizations/actions/list-organization-members";
import type { OrganizationMember } from "@/features/organizations/types";

interface Props {
  organizationId: string;
  columns: ColumnDef<OrganizationMember>[];
}

export const useMembersTable = ({ organizationId, columns }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data, isSuccess, isLoading, isError, refetch, isRefetching } =
    useQuery({
      queryKey: ["organization", organizationId, "member", "list", pagination],
      queryFn: async () => {
        const { data, error } = await listOrganizationMembers({
          organizationId,
          limit: pagination.pageSize,
          offset: pagination.pageIndex * pagination.pageSize,
        });

        if (error) return Promise.reject(error);

        return data;
      },
    });

  const defaultData = useMemo(() => [], []);

  const table = useReactTable({
    data: (data?.members as OrganizationMember[]) ?? defaultData,
    columns,
    rowCount: data?.total,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination: true,
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
