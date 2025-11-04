"use client";

import { Row } from "@tanstack/react-table";
import { CircleXIcon, LoaderIcon, MoreHorizontal } from "lucide-react";
import type { Invitation } from "better-auth/plugins";

import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";

import { useInvitationsTableRowActions } from "@/features/organizations/hooks/use-invitations-table-row-actions";

interface InvitationsTableRowActionsProps {
  row: Row<Invitation>;
}

export function InvitationsTableRowActions({
  row,
}: InvitationsTableRowActionsProps) {
  const { isCancelInvitationPending, handleCancelInvitation } =
    useInvitationsTableRowActions({
      invitation: row.original,
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
              disabled={isCancelInvitationPending}
              variant="destructive"
              onSelect={handleCancelInvitation}
            >
              {isCancelInvitationPending ? (
                <LoaderIcon className="size-4 animate-spin" />
              ) : (
                <CircleXIcon />
              )}
              Cancelar invitación
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
