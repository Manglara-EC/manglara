"use client";

import { useTranslation } from "react-i18next";
import {
  TypographyH1,
  TypographyMuted,
} from "@/shared/components/ui/typography";

export function AdminPageContent() {
  const { t: tAdmin } = useTranslation("admin");

  return (
    <div className="space-y-2">
      <TypographyH1>{tAdmin("adminPage.text.title")}</TypographyH1>
      <TypographyMuted>{tAdmin("adminPage.text.description")}</TypographyMuted>
    </div>
  );
}
