"use client";

import Link from "next/link";
import { ArrowLeftIcon, ClockIcon } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

import {
  TypographyH3,
  TypographyMuted,
} from "@/shared/components/ui/typography";
import { Badge } from "@/shared/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import {
  ORGANIZATION_ROLE_DISPLAY_NAMES,
  normalizeOrganizationRole,
} from "@/shared/constants/roles";

import { UpdateOrganizationButton } from "@/features/organizations/components/update-organization-button";
import type {
  Organization,
  OrganizationOverview,
} from "@/features/organizations/types";

interface Props {
  organization: OrganizationOverview;
}

/** Encabezado de la comuna con el rol del usuario actual en ella. */
export const OrganizationPageHeader = ({ organization }: Props) => {
  const canEdit = organization.permissions.includes("organization:update");
  const roleLabel = organization.viewerRole
    ? ORGANIZATION_ROLE_DISPLAY_NAMES[
        normalizeOrganizationRole(organization.viewerRole)
      ]
    : organization.isPlatformAdmin
      ? "Administrador global"
      : null;

  return (
    <div className="sticky top-0 flex items-center justify-between pb-2 backdrop-blur-sm md:static md:pb-0 md:backdrop-blur-none">
      <div>
        <TypographyH3 className="flex items-center gap-2">
          <Link href="/organizations" className="md:hidden">
            <ArrowLeftIcon />
          </Link>
          {organization.name}
          {roleLabel && <Badge variant="secondary">{roleLabel}</Badge>}
        </TypographyH3>

        <TypographyMuted className="text-xs">
          <Tooltip>
            <TooltipTrigger className="flex items-center gap-1">
              <ClockIcon className="size-3" />
              {formatDistanceToNow(organization.createdAt, {
                locale: es,
                addSuffix: true,
              })}
            </TooltipTrigger>
            <TooltipContent>
              {format(organization.createdAt, "PPP, HH:mm", { locale: es })}
            </TooltipContent>
          </Tooltip>
        </TypographyMuted>
      </div>

      {canEdit && (
        <UpdateOrganizationButton
          organization={
            {
              id: organization.id,
              name: organization.name,
              slug: organization.slug,
              logo: organization.logo,
              createdAt: organization.createdAt,
              metadata: null,
            } satisfies Organization
          }
        />
      )}
    </div>
  );
};
