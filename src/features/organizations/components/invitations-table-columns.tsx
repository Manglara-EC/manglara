"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircleIcon,
  CircleXIcon,
  ClockIcon,
  UserRoundCogIcon,
  UserRoundIcon,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { Invitation } from "better-auth/plugins";

import { Badge } from "@/shared/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

import { InvitationsTableColumnHeader } from "@/features/organizations/components/invitations-table-column-header";
import { InvitationsTableRowActions } from "@/features/organizations/components/invitations-table-row-actions";

export const columns: ColumnDef<Invitation>[] = [
  // {
  //   accessorKey: "id",
  //   header: ({ column }) => (
  //     <InvitationsTableColumnHeader column={column} title="Id" />
  //   ),
  //   cell: ({ row }) => (
  //     <div className="ml-2.5 flex space-x-2">
  //       <span className="w-fit font-medium">{row.getValue("id")}</span>
  //     </div>
  //   ),
  // },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <InvitationsTableColumnHeader
        column={column}
        title="Correo electrónico"
      />
    ),
    cell: ({ row }) => {
      return (
        <div className="ml-2.5 flex items-center gap-2">
          <span className="w-max font-medium">{row.original.email}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <InvitationsTableColumnHeader column={column} title="Rol" />
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
    accessorKey: "status",
    header: ({ column }) => (
      <InvitationsTableColumnHeader column={column} title="Estado" />
    ),
    cell: ({ row }) => {
      const status = row.original.status;

      switch (status) {
        case "pending":
          return (
            <div className="ml-2.5 flex space-x-2">
              <Badge variant="default">
                {<ClockIcon />} {status}
              </Badge>
            </div>
          );
        case "accepted":
          return (
            <div className="ml-2.5 flex space-x-2">
              <Badge variant="secondary">
                {<CheckCircleIcon />} {status}
              </Badge>
            </div>
          );
        case "canceled":
          return (
            <div className="ml-2.5 flex space-x-2">
              <Badge variant="outline">
                {<CircleXIcon />} {status}
              </Badge>
            </div>
          );
        case "rejected":
          return (
            <div className="ml-2.5 flex space-x-2">
              <Badge variant="destructive">
                {<CircleXIcon />} {status}
              </Badge>
            </div>
          );
      }
    },
  },
  {
    accessorKey: "expiresAt",
    header: ({ column }) => (
      <InvitationsTableColumnHeader column={column} title="Expira en" />
    ),
    cell: ({ row }) => {
      return (
        <div className="ml-2.5 flex space-x-2">
          <Tooltip>
            <TooltipTrigger className="cursor-pointer">
              <span className="w-max font-medium">
                {formatDistanceToNow(row.original.expiresAt, {
                  locale: es,
                  addSuffix: true,
                })}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {format(row.original.expiresAt, "PPP, HH:mm", {
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
    cell: ({ row }) => <InvitationsTableRowActions row={row} />,
  },
];
