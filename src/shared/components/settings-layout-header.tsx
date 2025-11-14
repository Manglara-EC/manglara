"use client";

import { useTranslation } from "react-i18next";
import {
  TypographyH1,
  TypographyMuted,
} from "@/shared/components/ui/typography";
import { MobileWrapper } from "@/shared/components/mobile-wrapper";

export function SettingsLayoutHeader() {
  const { t: tSettings } = useTranslation("settings");

  return (
    <MobileWrapper wrapperPage="/settings">
      <div className="space-y-2">
        <TypographyH1>{tSettings("settingsLayout.text.title")}</TypographyH1>
        <TypographyMuted>
          {tSettings("settingsLayout.text.description")}
        </TypographyMuted>
      </div>
    </MobileWrapper>
  );
}
