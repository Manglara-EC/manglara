"use client";

import {
  TypographyH4,
  TypographyMuted,
} from "@/shared/components/ui/typography";

import { OrganizationItemsTable } from "@/features/organizations/components/organization-items-table";

interface Props {
  organizationId: string;
  /** `all`: administración de la comuna; `own`: ítems del vendedor. */
  scope: "all" | "own";
}

export function OrganizationItemsView({ organizationId, scope }: Props) {
  return (
    <div className="space-y-4 pb-8">
      <div className="space-y-1">
        <TypographyH4>
          {scope === "all" ? "Ítems de la comuna" : "Mis ítems en esta comuna"}
        </TypographyH4>
        <TypographyMuted>
          {scope === "all"
            ? "Revisa, aprueba o rechaza lo que publican los vendedores de la comuna."
            : "Tus productos y servicios en esta comuna y su estado de revisión."}
        </TypographyMuted>
      </div>

      <OrganizationItemsTable organizationId={organizationId} />
    </div>
  );
}
