"use client";

import Link from "next/link";
import { ArrowLeftIcon, ClockIcon } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

import {
  TypographyH3,
  TypographyMuted,
} from "@/shared/components/ui/typography";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

import { UpdateOrganizationButton } from "@/features/organizations/components/update-organization-button";
import { OrganizationPageHeaderError } from "@/features/organizations/components/organization-page-header-error";
import { OrganizationPageHeaderSkeleton } from "@/features/organizations/components/organization-page-header-skeleton";
import { useOrganizationPageHeader } from "@/features/organizations/hooks/use-organization-page-header";
import type { Organization } from "@/features/organizations/types";

interface Props {
  organizationId: string;
}

export const OrganizationPageHeader = ({ organizationId }: Props) => {
  const { data, isLoading, isError, isRefetching, refetch } =
    useOrganizationPageHeader({
      organizationId,
    });

  if (isLoading) return <OrganizationPageHeaderSkeleton />;

  if (isError)
    return (
      <OrganizationPageHeaderError
        refetch={refetch}
        isRefetching={isRefetching}
      />
    );

  return (
    <div className="sticky top-0 flex items-center justify-between pb-2 backdrop-blur-sm md:static md:pb-0 md:backdrop-blur-none">
      <div>
        <TypographyH3 className="flex items-center gap-2">
          <Link href="/organizations" className="md:hidden">
            <ArrowLeftIcon />
          </Link>
          {data!.name}
        </TypographyH3>

        <TypographyMuted className="text-xs">
          <Tooltip>
            <TooltipTrigger className="flex items-center gap-1">
              <ClockIcon className="size-3" />
              {formatDistanceToNow(data!.createdAt, {
                locale: es,
                addSuffix: true,
              })}
            </TooltipTrigger>
            <TooltipContent>
              {format(data!.createdAt, "PPP, HH:mm", { locale: es })}
            </TooltipContent>
          </Tooltip>
        </TypographyMuted>
      </div>

      <UpdateOrganizationButton organization={data! as Organization} />
    </div>
  );
};
