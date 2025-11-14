"use client";

import { useTranslation } from "react-i18next";
import {
  TypographyH1,
  TypographyMuted,
} from "@/shared/components/ui/typography";
import { MobileWrapper } from "@/shared/components/mobile-wrapper";
import { CreateOrganizationButton } from "@/features/organizations/components/create-organization-button";

export function OrganizationsHeader() {
  const { t: tOrganization } = useTranslation("organization");

  return (
    <MobileWrapper wrapperPage="/organizations">
      <div className="flex w-full items-center justify-between">
        <div className="space-y-2">
          <TypographyH1>
            {tOrganization("organizationsLayout.text.title")}
          </TypographyH1>
          <TypographyMuted>
            {tOrganization("organizationsLayout.text.description")}
          </TypographyMuted>
        </div>

        <CreateOrganizationButton />
      </div>
    </MobileWrapper>
  );
}
