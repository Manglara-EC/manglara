"use client";

import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

import { InvitationsTableFacetedFilter } from "@/features/organizations/components/invitations-table-faceted-filter";
import { InvitationsTableViewOptions } from "@/features/organizations/components/invitations-table-view-options";

interface InvitationsTableToolbarProps<TData> {
  table: Table<TData>;
}

export function InvitationsTableToolbar<TData>({
  table,
}: InvitationsTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Buscar correo electrónico..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("role") && (
          <InvitationsTableFacetedFilter
            column={table.getColumn("role")}
            title="Rol"
            options={[
              { label: "Dueño", value: "owner" },
              { label: "Miembro", value: "member" },
            ]}
          />
        )}
        {table.getColumn("status") && (
          <InvitationsTableFacetedFilter
            column={table.getColumn("status")}
            title="Estado"
            options={[
              { label: "Pendiente", value: "pending" },
              { label: "Aceptado", value: "accepted" },
              { label: "Cancelado", value: "canceled" },
              { label: "Rechazado", value: "rejected" },
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

      <InvitationsTableViewOptions table={table} />
    </div>
  );
}
