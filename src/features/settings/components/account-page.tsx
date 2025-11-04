import { SettingsPageHeader } from "@/features/settings/components/settings-page-header";
import { UpdateEmailForm } from "@/features/settings/components/update-email-form";
import { UpdateNameForm } from "@/features/settings/components/update-name-form";
import { UpdateUsernameForm } from "@/features/settings/components/update-username-form";

export async function SettingsAccountPage() {
  return (
    <>
      <SettingsPageHeader
        title="Cuenta"
        description="Actualiza la configuración de tu cuenta."
      />

      <UpdateNameForm />
      <UpdateUsernameForm />
      <UpdateEmailForm />
    </>
  );
}
