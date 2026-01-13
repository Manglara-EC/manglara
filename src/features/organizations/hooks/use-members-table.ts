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

import { authClient } from "@/shared/lib/better-auth/client";

import { columns } from "@/features/organizations/components/members-table-columns";
import type { OrganizationMember } from "@/features/organizations/types";

interface Props {
  organizationId: string;
}

export const useMembersTable = ({ organizationId }: Props) => {
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
      queryFn: async ({ signal }) => {
        const { data, error } = await authClient.organization.listMembers({
          query: {
            organizationId,
            limit: pagination.pageSize,
            offset: pagination.pageIndex * pagination.pageSize,
            sortBy: "createdAt",
            sortDirection: "desc",
          },
          fetchOptions: { signal },
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
