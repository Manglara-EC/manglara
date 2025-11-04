"use client";

import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  const { t: tAdmin } = useTranslation("admin");

  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder={tAdmin("dataTableToolbar.text.filterUsers")}
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("role") && (
          <DataTableFacetedFilter
            column={table.getColumn("role")}
            title={tAdmin("dataTableToolbar.fields.role")}
            options={[
              {
                label: tAdmin("dataTableToolbar.text.administrator"),
                value: "admin",
              },
              { label: tAdmin("dataTableToolbar.text.user"), value: "user" },
            ]}
          />
        )}
        {table.getColumn("banned") && (
          <DataTableFacetedFilter
            column={table.getColumn("banned")}
            title={tAdmin("dataTableToolbar.fields.banned")}
            options={[
              { label: tAdmin("dataTableToolbar.text.banned"), value: "true" },
              {
                label: tAdmin("dataTableToolbar.text.notBanned"),
                value: "false",
              },
            ]}
          />
        )}
        {table.getColumn("emailVerified") && (
          <DataTableFacetedFilter
            column={table.getColumn("emailVerified")}
            title={tAdmin("dataTableToolbar.fields.emailVerified")}
            options={[
              {
                label: tAdmin("dataTableToolbar.text.verified"),
                value: "true",
              },
              {
                label: tAdmin("dataTableToolbar.text.notVerified"),
                value: "false",
              },
            ]}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            {tAdmin("dataTableToolbar.actions.reset")}
            <X />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
