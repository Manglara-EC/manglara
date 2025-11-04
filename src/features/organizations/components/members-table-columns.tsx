"use client";

import { useTranslation } from "react-i18next";

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
  {
    accessorKey: "name",
    header: ({ column }) => {
      const { t: tCommon } = useTranslation("common");
      return (
        <MembersTableColumnHeader
          column={column}
          title={tCommon("fields.name")}
        />
      );
    },
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
    header: ({ column }) => {
      const { t: tCommon } = useTranslation("common");
      return (
        <MembersTableColumnHeader
          column={column}
          title={tCommon("fields.email")}
        />
      );
    },
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
    header: ({ column }) => {
      const { t: tOrganization } = useTranslation("organization");
      return (
        <MembersTableColumnHeader
          column={column}
          title={tOrganization("membersTableColumns.fields.role")}
        />
      );
    },
    cell: ({ row }) => {
      const { t: tOrganization } = useTranslation("organization");
      const role = row.original.role;
      const isOwner = role === "owner";

      return (
        <div className="ml-2.5 flex space-x-2">
          <Badge variant={isOwner ? "default" : "secondary"}>
            {isOwner ? <UserRoundCogIcon /> : <UserRoundIcon />}
            {isOwner
              ? tOrganization("membersTableColumns.text.owner")
              : tOrganization("membersTableColumns.text.member")}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      const { t: tOrganization } = useTranslation("organization");
      return (
        <MembersTableColumnHeader
          column={column}
          title={tOrganization("membersTableColumns.fields.memberSince")}
        />
      );
    },
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
