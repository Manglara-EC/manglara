"use client";

import { flexRender } from "@tanstack/react-table";
import { LoaderIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/shared/components/ui/scroll-area";

import { InvitationsTablePagination } from "@/features/organizations/components/invitations-table-pagination";
import { InvitationsTableToolbar } from "@/features/organizations/components/invitations-table-toolbar";
import { columns } from "@/features/organizations/components/invitations-table-columns";
import { useInvitationsTable } from "@/features/organizations/hooks/use-invitations-table";

interface Props {
  organizationId: string;
}

export function InvitationsTable({ organizationId }: Props) {
  const { table, isSuccess, isLoading, isError, refetch, isRefetching } =
    useInvitationsTable({ organizationId });

  return (
    <div className="w-full space-y-4">
      <InvitationsTableToolbar table={table} />

      <div className="flex w-full">
        <ScrollArea className="w-1 flex-1 rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {isLoading &&
                Array.from({
                  length: table.getState().pagination.pageSize,
                }).map((_, rowIndex) => (
                  <TableRow key={rowIndex} className="h-12">
                    {columns.slice(0, -1).map((_, columnIndex) => (
                      <TableCell key={columnIndex}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {isError && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24">
                    <div className="flex flex-col items-center justify-center gap-2">
                      Algo salió mal 😢
                      <Button
                        variant="outline"
                        onClick={() => refetch()}
                        disabled={isRefetching}
                        size="sm"
                      >
                        {isRefetching && (
                          <LoaderIcon className="animate-spin" />
                        )}
                        Intentar de nuevo
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {table.getRowModel().rows?.length > 0 &&
                isSuccess &&
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {table.getRowModel().rows?.length === 0 && isSuccess && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No se encontraron invitaciones 😢
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <InvitationsTablePagination table={table} />
    </div>
  );
}
