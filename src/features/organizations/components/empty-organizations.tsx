"use client";

import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui/card";
import { TypographyLarge } from "@/shared/components/ui/typography";

export function EmptyOrganizations() {
  const { t: tOrganizations } = useTranslation("organizations");

  return (
    <Card className="-mt-12 flex flex-col items-center justify-center rounded-4xl p-8">
      <TypographyLarge className="text-center text-xl font-medium">
        {tOrganizations("organizationsLayout.text.empty")}
      </TypographyLarge>
    </Card>
  );
}
