import { Building2Icon } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  TypographyH3,
  TypographyMuted,
} from "@/shared/components/ui/typography";

// Forzar renderizado dinámico (no cachear)
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OrganizationsPage() {
  return (
    <Card className="border-dashed">
      <CardContent className="pt-12 pb-12 text-center">
        <Building2Icon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <TypographyH3 className="text-lg">
          Selecciona una organización
        </TypographyH3>
        <TypographyMuted className="mt-2">
          Elige una organización del menú lateral para ver sus detalles
        </TypographyMuted>
      </CardContent>
    </Card>
  );
}
