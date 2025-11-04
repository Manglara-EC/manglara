"use client";

import { KeyRoundIcon, UserRoundPenIcon } from "lucide-react";

import { SubNavLink } from "@/shared/components/sub-nav-link";
import { useInMobileWrapper } from "@/shared/hooks/use-in-mobile-wrapper";
import { useTranslation } from "react-i18next";

export function SettingsSidebar() {
  const { t: tSettings } = useTranslation("settings");

  const { isMobile, isMounted, isWrapperPage } = useInMobileWrapper({
    wrapperPage: "/settings",
  });

  const items = [
    {
      label: tSettings("settingsSidebar.items.account"),
      href: "/settings/account",
      icon: <UserRoundPenIcon />,
    },
    {
      label: tSettings("settingsSidebar.items.security"),
      href: "/settings/security",
      icon: <KeyRoundIcon />,
    },
  ];

  if (!isMounted) return null;

  if (isMobile && !isWrapperPage) return null;

  return (
    <aside className="h-full w-full md:w-max">
      <nav className="flex flex-col gap-2">
        {items.map((item) => (
          <SubNavLink
            key={item.href}
            href={item.href}
            additionalMatches={
              !isMobile && item.href === "/settings/account"
                ? ["/settings"]
                : undefined
            }
            label={item.label}
            icon={item.icon}
            includeArrow
            exactMatch
          />
        ))}
      </nav>
    </aside>
  );
}
