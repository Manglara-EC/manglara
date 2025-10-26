"use client";

import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

import { MembersTableFacetedFilter } from "@/features/organizations/components/members-table-faceted-filter";
import { MembersTableViewOptions } from "@/features/organizations/components/members-table-view-options";

interface MembersTableToolbarProps<TData> {
  table: Table<TData>;
}

export function MembersTableToolbar<TData>({
  table,
}: MembersTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filtrar miembros..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("role") && (
          <MembersTableFacetedFilter
            column={table.getColumn("role")}
            title="Rol"
            options={[
              { label: "Dueño", value: "owner" },
              { label: "Miembro", value: "member" },
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

      <MembersTableViewOptions table={table} />
    </div>
  );
}
