"use client";

import { useTranslation } from "react-i18next";
import { LoaderIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { TypographyH4 } from "@/shared/components/ui/typography";

import { useDeleteOrganizationButton } from "@/features/organizations/hooks/use-delete-organization-button";

interface Props {
  organizationId: string;
}

export function DeleteOrganizationButton({ organizationId }: Props) {
  const { t: tCommon } = useTranslation("common");
  const { t: tOrganization } = useTranslation("organization");

  const { isPending, handleDeleteOrganization } = useDeleteOrganizationButton({
    organizationId,
  });

  return (
    <div className="bg-destructive/10 space-y-8 rounded-xl border p-4">
      <TypographyH4>
        {tOrganization("deleteOrganizationButton.text.dangerZone")}
      </TypographyH4>

      <div className="grid gap-2">
        <div className="flex flex-wrap items-center justify-start gap-4">
          <Label>
            {tOrganization("deleteOrganizationButton.text.deleteOrganization")}
          </Label>

          <Button
            disabled={isPending}
            type="button"
            size="sm"
            variant="destructive"
            onClick={handleDeleteOrganization}
          >
            {isPending && <LoaderIcon className="animate-spin" />}
            {tCommon("actions.delete")}
          </Button>
        </div>

        <p className="text-muted-foreground text-sm">
          {tOrganization("deleteOrganizationButton.text.warning")}
        </p>
      </div>
    </div>
  );
}
