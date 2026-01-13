"use client";

import { ColumnDef } from "@tanstack/react-table";
import { UserRoundCogIcon, UserRoundIcon } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

import { Badge } from "@/shared/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

import { MembersTableColumnHeader } from "@/features/organizations/components/members-table-column-header";
import { MembersTableRowActions } from "@/features/organizations/components/members-table-row-actions";
import type { OrganizationMember } from "@/features/organizations/types";

export const columns: ColumnDef<OrganizationMember>[] = [
  // {
  //   accessorKey: "id",
  //   header: ({ column }) => (
  //     <MembersTableColumnHeader column={column} title="Id" />
  //   ),
  //   cell: ({ row }) => (
  //     <div className="ml-2.5 flex space-x-2">
  //       <span className="w-fit font-medium">{row.getValue("id")}</span>
  //     </div>
  //   ),
  // },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <MembersTableColumnHeader column={column} title="Nombre" />
    ),
    cell: ({ row }) => {
      return (
        <div className="ml-2.5 flex items-center gap-2">
          <span className="w-max font-medium">{row.original.user.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <MembersTableColumnHeader column={column} title="Correo electrónico" />
    ),
    cell: ({ row }) => {
      return (
        <div className="ml-2.5 flex items-center gap-2">
          <span className="w-max font-medium">{row.original.user.email}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <MembersTableColumnHeader column={column} title="Rol" />
    ),
    cell: ({ row }) => {
      const role = row.original.role;
      const isOwner = role === "owner";

      return (
        <div className="ml-2.5 flex space-x-2">
          <Badge variant={isOwner ? "default" : "secondary"}>
            {isOwner ? <UserRoundCogIcon /> : <UserRoundIcon />}
            {role}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <MembersTableColumnHeader column={column} title="Miembro desde" />
    ),
    cell: ({ row }) => {
      return (
        <div className="ml-2.5 flex space-x-2">
          <Tooltip>
            <TooltipTrigger className="cursor-pointer">
              <span className="w-max font-medium">
                {formatDistanceToNow(row.original.createdAt, {
                  locale: es,
                  addSuffix: true,
                })}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {format(row.original.createdAt, "PPP, HH:mm", {
                locale: es,
              })}
            </TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) =>
      row.original.role === "owner" ? null : (
        <MembersTableRowActions
          row={row}
          pagination={table.getState().pagination}
        />
      ),
  },
];
