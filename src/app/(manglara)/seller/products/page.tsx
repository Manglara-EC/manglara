import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import {
  TypographyH1,
  TypographyMuted,
} from "@/shared/components/ui/typography";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";

export const metadata: Metadata = {
  title: "Manglara | Mis Productos",
};

export default function SellerProductsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <TypographyH1>Mis Productos</TypographyH1>
          <TypographyMuted>
            Gestiona todos tus productos desde aquí
          </TypographyMuted>
        </div>
        <Button asChild>
          <Link href="/seller/products/create">
            <PlusIcon className="mr-2 h-4 w-4" />
            Crear producto
          </Link>
        </Button>
      </div>

      {/* Lista de productos (placeholder) */}
      <Card>
        <CardContent className="flex min-h-[300px] items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Aún no tienes productos publicados
            </p>
            <Button asChild variant="outline">
              <Link href="/seller/products/create">
                <PlusIcon className="mr-2 h-4 w-4" />
                Crear tu primer producto
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
