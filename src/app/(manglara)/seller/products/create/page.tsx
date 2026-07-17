import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import {
  TypographyH1,
  TypographyMuted,
} from "@/shared/components/ui/typography";
import { Button } from "@/shared/components/ui/button";

import { getUserOrganizations } from "@/features/organizations/actions/get-user-organizations";
import { CreateProductFormWrapper } from "@/features/seller/components/create-product-form-wrapper";

export const metadata: Metadata = {
  title: "Manglara | Crear Producto",
};

export default async function CreateProductPage() {
  // Obtener las organizaciones del usuario
  const { data: organizations, error } = await getUserOrganizations();

  if (error || !organizations || organizations.length === 0) {
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

        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive font-medium mb-2">
            No tienes organizaciones disponibles
          </p>
          <p className="text-muted-foreground text-sm mb-4">
            Para crear productos, primero debes pertenecer a una organización.
          </p>
          <Button asChild variant="outline">
            <Link href="/organizations">Ver organizaciones</Link>
          </Button>
        </div>
      </div>
    );
  }

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

      <CreateProductFormWrapper organizations={organizations} />
    </div>
  );
}
