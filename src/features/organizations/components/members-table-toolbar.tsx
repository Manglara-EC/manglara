"use client";
import { useTranslation } from "react-i18next";

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
  const { t: tOrganization } = useTranslation("organization");

  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder={tOrganization("membersTableToolbar.text.filterMembers")}
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("role") && (
          <MembersTableFacetedFilter
            column={table.getColumn("role")}
            title={tOrganization("membersTableToolbar.fields.role")}
            options={[
              {
                label: tOrganization("membersTableToolbar.text.owner"),
                value: "owner",
              },
              {
                label: tOrganization("membersTableToolbar.text.member"),
                value: "member",
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
            {tOrganization("membersTableToolbar.actions.reset")}
            <X />
          </Button>
        )}
      </div>

      <MembersTableViewOptions table={table} />
    </div>
  );
}
