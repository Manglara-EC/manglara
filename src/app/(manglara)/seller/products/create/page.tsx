import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import {
  TypographyH1,
  TypographyMuted,
} from "@/shared/components/ui/typography";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";

export const metadata: Metadata = {
  title: "Manglara | Crear Producto",
};

export default function CreateProductPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/seller/products">
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <TypographyH1>Crear Producto</TypographyH1>
          <TypographyMuted>
            Define los detalles de tu nuevo producto
          </TypographyMuted>
        </div>
      </div>

      {/* Placeholder - Formulario de productos pendiente */}
      <Card>
        <CardContent className="flex min-h-[300px] items-center justify-center">
          <p className="text-muted-foreground">
            Formulario de creación de productos próximamente...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
