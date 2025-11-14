"use client";

import { useTranslation } from "react-i18next";
import { TypographyLarge } from "@/shared/components/ui/typography";

export function OrganizationsSelectMessage() {
  const { t: tOrganization } = useTranslation("organization");

  return (
    <div className="grid h-full w-full place-content-center">
      <TypographyLarge className="text-muted-foreground mt-30 text-center font-normal">
        {tOrganization("organizationsPage.text.selectMessage")}
      </TypographyLarge>
    </div>
  );
}
