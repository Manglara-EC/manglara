"use client";

import { PaginationState, Row } from "@tanstack/react-table";
import { LoaderIcon, MoreHorizontal, TrashIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";

import { useMembersTableRowActions } from "@/features/organizations/hooks/use-members-table-row-actions";

import type { OrganizationMember } from "@/features/organizations/types";

interface MembersTableRowActionsProps {
  row: Row<OrganizationMember>;
  pagination: PaginationState;
}

export function MembersTableRowActions({
  row,
  pagination,
}: MembersTableRowActionsProps) {
  const { isRemoveMemberPending, handleRemoveMember } =
    useMembersTableRowActions({
      member: row.original,
      pagination,
    });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted flex h-8 w-8 p-0"
          >
            <MoreHorizontal />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          {row.original.role !== "owner" && (
            <DropdownMenuItem
              disabled={isRemoveMemberPending}
              variant="destructive"
              onSelect={handleRemoveMember}
            >
              {isRemoveMemberPending ? (
                <LoaderIcon className="size-4 animate-spin" />
              ) : (
                <TrashIcon />
              )}
              Quitar miembro
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
