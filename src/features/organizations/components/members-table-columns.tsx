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
import {
  ASSIGNABLE_ORGANIZATION_ROLES,
  ORGANIZATION_ROLE_DISPLAY_NAMES,
  OrganizationRole,
  canAssignOrganizationRole,
  canManageAs,
  normalizeOrganizationRole,
} from "@/shared/constants/roles";

import { MembersTableColumnHeader } from "@/features/organizations/components/members-table-column-header";
import { MembersTableRowActions } from "@/features/organizations/components/members-table-row-actions";
import type {
  MembersTableViewer,
  OrganizationMember,
} from "@/features/organizations/types";

const ALL_ROLES = Object.values(OrganizationRole);

/** Roles que el usuario actual puede asignar a un miembro (vacío = ninguno). */
const getAssignableRoles = (
  viewer: MembersTableViewer,
  member: OrganizationMember,
): readonly OrganizationRole[] => {
  if (!viewer.canManageMembers || member.userId === viewer.userId) return [];

  const targetRole = normalizeOrganizationRole(member.role);

  if (
    !canAssignOrganizationRole(
      viewer.viewerRole,
      targetRole,
      viewer.isPlatformAdmin,
    )
  ) {
    return [];
  }

  if (viewer.isPlatformAdmin) return ALL_ROLES;

  return viewer.viewerRole
    ? ASSIGNABLE_ORGANIZATION_ROLES[viewer.viewerRole]
    : [];
};

/**
 * Columnas de la tabla de miembros según lo que puede ver/hacer el usuario:
 * - correo: solo administradores de la comuna y admin global;
 * - acciones: solo sobre miembros que puede gestionar.
 */
export const getMembersColumns = (
  viewer: MembersTableViewer,
): ColumnDef<OrganizationMember>[] => [
  {
    id: "name",
    accessorFn: (member) => member.user.name,
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
  ...(viewer.canSeeEmails
    ? [
        {
          id: "email",
          accessorFn: (member: OrganizationMember) => member.user.email,
          header: ({ column }) => (
            <MembersTableColumnHeader
              column={column}
              title="Correo electrónico"
            />
          ),
          cell: ({ row }) => {
            return (
              <div className="ml-2.5 flex items-center gap-2">
                <span className="w-max font-medium">
                  {row.original.user.email}
                </span>
              </div>
            );
          },
        } as ColumnDef<OrganizationMember>,
      ]
    : []),
  {
    accessorKey: "role",
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    header: ({ column }) => (
      <MembersTableColumnHeader column={column} title="Rol" />
    ),
    cell: ({ row }) => {
      const role = normalizeOrganizationRole(row.original.role);
      const isManager = canManageAs(role);

      return (
        <div className="ml-2.5 flex space-x-2">
          <Badge variant={isManager ? "default" : "secondary"}>
            {isManager ? <UserRoundCogIcon /> : <UserRoundIcon />}
            {ORGANIZATION_ROLE_DISPLAY_NAMES[role]}
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
  ...(viewer.canManageMembers
    ? [
        {
          id: "actions",
          cell: ({ row }) => {
            const assignableRoles = getAssignableRoles(viewer, row.original);

            return assignableRoles.length > 0 ? (
              <MembersTableRowActions
                row={row}
                assignableRoles={assignableRoles}
              />
            ) : null;
          },
        } as ColumnDef<OrganizationMember>,
      ]
    : []),
];
