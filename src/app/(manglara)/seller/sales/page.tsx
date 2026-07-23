import type { Metadata } from "next";

import {
  TypographyH1,
  TypographyMuted,
} from "@/shared/components/ui/typography";
import { Card, CardContent } from "@/shared/components/ui/card";

export const metadata: Metadata = {
  title: "Manglara | Ventas",
};

export default function SellerSalesPage() {
  return (
    <div className="space-y-8">
      <div>
        <TypographyH1>Ventas</TypographyH1>
        <TypographyMuted>Historial de ventas y transacciones</TypographyMuted>
      </div>

      {/* Placeholder */}
      <Card>
        <CardContent className="flex min-h-[300px] items-center justify-center">
          <p className="text-muted-foreground">
            Aún no tienes ventas registradas
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
