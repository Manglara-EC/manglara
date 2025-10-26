"use client";

import { LoaderIcon, RotateCcwIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { TypographyMuted } from "@/shared/components/ui/typography";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { SubNavLink } from "@/shared/components/sub-nav-link";
import { ScrollArea } from "@/shared/components/ui/scroll-area";

import { OrganizationsListSkeleton } from "@/features/organizations/components/organizations-list-skeleton";
import { useOrganizationsSidebar } from "@/features/organizations/hooks/use-organizations-sidebar";

export function OrganizationsSidebar() {
  const {
    isMobile,
    isMounted,
    isWrapperPage,
    data,
    isSuccess,
    isLoading,
    isError,
    isRefetching,
    refetch,
    setActiveOrganization,
  } = useOrganizationsSidebar();

  if (!isMounted) return null;

  if (isMobile && !isWrapperPage) return null;

  return (
    <aside className="h-full w-full md:w-max">
      <ScrollArea className="h-full md:pr-4">
        <nav className="flex flex-col gap-2">
          {isLoading && <OrganizationsListSkeleton />}

          {isError && (
            <div className="mx-6 flex flex-col gap-2">
              <TypographyMuted>Algo salió mal 😢</TypographyMuted>

              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isRefetching}
              >
                {isRefetching ? (
                  <LoaderIcon className="animate-spin" />
                ) : (
                  <RotateCcwIcon />
                )}
                Reintentar
              </Button>
            </div>
          )}

          {isSuccess &&
            data &&
            data.length > 0 &&
            data.map((item) => (
              <SubNavLink
                onNavigate={() => setActiveOrganization(item.slug!)}
                key={item.id}
                href={`/organizations/${item.slug}`}
                label={item.name}
                icon={
                  <Avatar className="size-6">
                    <AvatarImage src={item.logo || undefined} alt={item.name} />
                    <AvatarFallback>
                      {item.name
                        ?.split(" ")
                        .map((name) => name[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                }
                includeArrow
                exactMatch
              />
            ))}

          {isSuccess && data && data.length === 0 && (
            <TypographyMuted>No hay organizaciones creadas 😢</TypographyMuted>
          )}
        </nav>
      </ScrollArea>
    </aside>
  );
}
