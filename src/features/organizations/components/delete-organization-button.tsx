"use client";

import { LoaderIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { TypographyH4 } from "@/shared/components/ui/typography";

import { useDeleteOrganizationButton } from "@/features/organizations/hooks/use-delete-organization-button";

interface Props {
  organizationId: string;
}

export function DeleteOrganizationButton({ organizationId }: Props) {
  const { isPending, handleDeleteOrganization } = useDeleteOrganizationButton({
    organizationId,
  });

  return (
    <div className="bg-destructive/10 space-y-8 rounded-xl border p-4">
      <TypographyH4>Zona de peligro</TypographyH4>

      <div className="grid gap-2">
        <div className="flex flex-wrap items-center justify-start gap-4">
          <Label>Eliminar organización</Label>

          <Button
            disabled={isPending}
            type="button"
            size="sm"
            variant="destructive"
            onClick={handleDeleteOrganization}
          >
            {isPending && <LoaderIcon className="animate-spin" />}
            Eliminar
          </Button>
        </div>

        <p className="text-muted-foreground text-sm">
          Ten cuidado, esta acción no puede ser deshecha. Toda la información de
          la organización será eliminada.
        </p>
      </div>
    </div>
  );
}
