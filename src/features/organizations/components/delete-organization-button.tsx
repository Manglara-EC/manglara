"use client";

import { LoaderIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { TypographyH4 } from "@/shared/components/ui/typography";

import { useDeleteOrganizationButton } from "@/features/organizations/hooks/use-delete-organization-button";

interface Props {
  organizationId: string;
  organizationName: string;
}

/** Zona de peligro: solo se muestra al administrador global. */
export function DeleteOrganizationButton({
  organizationId,
  organizationName,
}: Props) {
  const {
    isPending,
    confirmationName,
    setConfirmationName,
    canConfirm,
    handleDeleteOrganization,
  } = useDeleteOrganizationButton({ organizationId, organizationName });

  return (
    <div className="bg-destructive/10 space-y-8 rounded-xl border p-4">
      <TypographyH4>Zona de peligro</TypographyH4>

      <div className="grid gap-3">
        <Label htmlFor="delete-organization-confirmation">
          Escribe <strong>{organizationName}</strong> para eliminar la comuna
        </Label>

        <div className="flex flex-wrap items-center justify-start gap-4">
          <Input
            id="delete-organization-confirmation"
            className="max-w-xs"
            value={confirmationName}
            onChange={(event) => setConfirmationName(event.target.value)}
            autoComplete="off"
            disabled={isPending}
          />

          <Button
            disabled={isPending || !canConfirm}
            type="button"
            size="sm"
            variant="destructive"
            onClick={handleDeleteOrganization}
          >
            {isPending && <LoaderIcon className="animate-spin" />}
            Eliminar comuna
          </Button>
        </div>

        <p className="text-muted-foreground text-sm">
          Se eliminarán sus miembros, invitaciones, productos y servicios. No se
          puede eliminar una comuna con ventas o reservas registradas.
        </p>
      </div>
    </div>
  );
}
