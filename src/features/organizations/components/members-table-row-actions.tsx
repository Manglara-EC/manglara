"use client";

import { Row } from "@tanstack/react-table";
import {
  LoaderIcon,
  MoreHorizontal,
  TrashIcon,
  UserRoundCogIcon,
} from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  ORGANIZATION_ROLE_DISPLAY_NAMES,
  OrganizationRole,
} from "@/shared/constants/roles";

import { useMembersTableRowActions } from "@/features/organizations/hooks/use-members-table-row-actions";

import type { OrganizationMember } from "@/features/organizations/types";

interface MembersTableRowActionsProps {
  row: Row<OrganizationMember>;
  /** Roles que el usuario actual puede asignar a este miembro. */
  assignableRoles: readonly OrganizationRole[];
}

export function MembersTableRowActions({
  row,
  assignableRoles,
}: MembersTableRowActionsProps) {
  const { isPending, handleRemoveMember, handleUpdateRole } =
    useMembersTableRowActions({
      member: row.original,
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="data-[state=open]:bg-muted flex h-8 w-8 p-0"
          disabled={isPending}
        >
          {isPending ? (
            <LoaderIcon className="size-4 animate-spin" />
          ) : (
            <MoreHorizontal />
          )}
          <span className="sr-only">Abrir menú</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <UserRoundCogIcon className="size-4" />
            Cambiar rol
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={row.original.role}
              onValueChange={(role) =>
                handleUpdateRole(role as OrganizationRole)
              }
            >
              {assignableRoles.map((role) => (
                <DropdownMenuRadioItem key={role} value={role}>
                  {ORGANIZATION_ROLE_DISPLAY_NAMES[role]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={isPending}
          variant="destructive"
          onSelect={handleRemoveMember}
        >
          <TrashIcon />
          Quitar de la comuna
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
