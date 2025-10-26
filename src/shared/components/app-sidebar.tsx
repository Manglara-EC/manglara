"use client";

import { LoaderIcon, RotateCcwIcon, TreePalmIcon } from "lucide-react";

import { TypographyLarge } from "@/shared/components/ui/typography";
import { NavLink } from "@/shared/components/nav-link";
import { NavUser } from "@/shared/components/nav-user";
import { useAppSidebar } from "@/shared/hooks/use-app-sidebar";
import { NavUserSkeleton } from "@/shared/components/nav-user-skeleton";
import { Button } from "@/shared/components/ui/button";

export const AppSidebar = () => {
  const {
    links,
    session,
    isSessionSuccess,
    isSessionLoading,
    isSessionError,
    refetchSession,
    isSessionRefetching,
  } = useAppSidebar();

  return (
    <div className="flex flex-col items-center gap-4 md:items-stretch">
      <TypographyLarge className="pl-2 text-center text-4xl font-extrabold">
        <TreePalmIcon className="size-10" />
      </TypographyLarge>

      <nav className="flex flex-col items-start gap-2 md:items-stretch">
        {links.map((link) => (
          <NavLink
            key={link.href}
            href={link.href}
            label={link.label}
            icon={link.icon}
          />
        ))}
      </nav>

      <div className="mt-auto max-w-60">
        {isSessionLoading && <NavUserSkeleton />}

        {isSessionError && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => refetchSession()}
          >
            Reintentar{" "}
            {isSessionRefetching ? (
              <LoaderIcon className="animate-spin" />
            ) : (
              <RotateCcwIcon />
            )}
          </Button>
        )}

        {isSessionSuccess && session && <NavUser user={session.user} />}
      </div>
    </div>
  );
};
