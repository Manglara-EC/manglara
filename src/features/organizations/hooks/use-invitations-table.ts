import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { Invitation } from "better-auth/plugins";

import { authClient } from "@/shared/lib/better-auth/client";

import { columns } from "@/features/organizations/components/invitations-table-columns";

interface Props {
  organizationId: string;
}

export const useInvitationsTable = ({ organizationId }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data, isSuccess, isLoading, isError, refetch, isRefetching } =
    useQuery({
      queryKey: ["organization", organizationId, "invitation", "list"],
      queryFn: async ({ signal }) => {
        const { data, error } = await authClient.organization.listInvitations({
          query: {
            organizationId,
          },
          fetchOptions: { signal },
        });

        if (error) return Promise.reject(error);

        return data;
      },
    });

  const defaultData = useMemo(() => [], []);

  const table = useReactTable({
    data: (data as Invitation[]) ?? defaultData,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
    },
    getRowId: (row) => row.id,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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
  };
};
