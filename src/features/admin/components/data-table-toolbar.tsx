"use client";

import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

import { DataTableFacetedFilter } from "@/features/admin/components/data-table-faceted-filter";
import { DataTableViewOptions } from "@/features/admin/components/data-table-view-options";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filtrar usuarios..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("role") && (
          <DataTableFacetedFilter
            column={table.getColumn("role")}
            title="Rol"
            options={[
              { label: "Administrador", value: "admin" },
              { label: "Usuario", value: "user" },
            ]}
          />
        )}
        {table.getColumn("banned") && (
          <DataTableFacetedFilter
            column={table.getColumn("banned")}
            title="Bloqueado"
            options={[
              { label: "Bloqueado", value: "true" },
              { label: "No bloqueado", value: "false" },
            ]}
          />
        )}
        {table.getColumn("emailVerified") && (
          <DataTableFacetedFilter
            column={table.getColumn("emailVerified")}
            title="Correo verificado"
            options={[
              { label: "Verificado", value: "true" },
              { label: "No verificado", value: "false" },
            ]}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Restablecer
            <X />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
