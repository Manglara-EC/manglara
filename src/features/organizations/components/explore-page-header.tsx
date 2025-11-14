"use client";

import { useTranslation } from "react-i18next";
import {
  TypographyH1,
  TypographyMuted,
} from "@/shared/components/ui/typography";

export function ExplorePageHeader() {
  const { t: tOrganization } = useTranslation("organization");

  return (
    <div className="space-y-2">
      <TypographyH1>{tOrganization("explorePage.text.title")}</TypographyH1>
      <TypographyMuted>
        {tOrganization("explorePage.text.description")}
      </TypographyMuted>
    </div>
  );
}
