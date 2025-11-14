"use client";

import { useTranslation } from "react-i18next";

import { LoaderIcon, RotateCcwIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { TypographyLarge } from "@/shared/components/ui/typography";

interface Props {
  refetch: () => void;
  isRefetching: boolean;
}

export const OrganizationPageHeaderError = ({
  refetch,
  isRefetching,
}: Props) => {
  const { t: tOrganization } = useTranslation("organization");

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <TypographyLarge className="text-center">
        {tOrganization("organizationPageHeaderError.text.errorFetchingData")}
      </TypographyLarge>

      <Button
        variant="outline"
        onClick={() => refetch()}
        disabled={isRefetching}
      >
        {isRefetching ? (
          <LoaderIcon className="animate-spin" />
        ) : (
          <RotateCcwIcon />
        )}
        {tOrganization("organizationPageHeaderError.actions.retry")}
      </Button>
    </div>
  );
};
