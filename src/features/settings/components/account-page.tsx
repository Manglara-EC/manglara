"use client";

import { SettingsPageHeader } from "@/features/settings/components/settings-page-header";
import { UpdateEmailForm } from "@/features/settings/components/update-email-form";
import { UpdateNameForm } from "@/features/settings/components/update-name-form";
import { UpdateUsernameForm } from "@/features/settings/components/update-username-form";
import { useTranslation } from "react-i18next";

export function SettingsAccountPage() {
  const { t: tSettings } = useTranslation("settings");

  return (
    <>
      <SettingsPageHeader
        title={tSettings("accountPage.text.title")}
        description={tSettings("accountPage.text.description")}
      />

      <UpdateNameForm />
      <UpdateUsernameForm />
      <UpdateEmailForm />
    </>
  );
}
