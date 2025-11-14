"use client";

import { useTranslation } from "react-i18next";
import {
  TypographyH1,
  TypographyMuted,
} from "@/shared/components/ui/typography";

export function HomePageHeader() {
  const { t: tCommon } = useTranslation("common");

  return (
    <div className="space-y-2">
      <TypographyH1>{tCommon("homePage.text.title")}</TypographyH1>
      <TypographyMuted>{tCommon("homePage.text.description")}</TypographyMuted>
    </div>
  );
}
