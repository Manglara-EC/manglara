"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRightIcon } from "lucide-react";

import { NavLinkIcon } from "@/shared/components/nav-link-icon";
import { cn } from "@/shared/utils/cn";

type Props = {
  href: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  includeArrow?: boolean;
  exactMatch?: boolean;
  additionalMatches?: string[];
} & Omit<React.ComponentProps<typeof Link>, "children">;

export const SubNavLink = ({
  href,
  label,
  icon,
  description,
  includeArrow,
  exactMatch,
  additionalMatches,
  onNavigate,
  ...props
}: Props & { onNavigate?: () => void }) => {
  const pathname = usePathname();

  const matches = [href, ...(additionalMatches || [])];
  const isActive = matches.some((match) =>
    exactMatch ? pathname === match : pathname.startsWith(match),
  );

  return (
    <Link
      title={label}
      aria-label={label}
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex w-fit flex-wrap items-center gap-2 rounded-xl px-4 py-2 text-xl transition-all duration-200",
        isActive ? "bg-accent" : "hover:bg-accent",
        includeArrow && "w-full justify-between",
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <NavLinkIcon icon={icon} />

        <div className="flex flex-col">
          <span>{label}</span>
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
      </div>
      {includeArrow && <ArrowRightIcon />}
    </Link>
  );
};
