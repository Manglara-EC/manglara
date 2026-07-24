import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import {
  TypographyH1,
  TypographyMuted,
} from "@/shared/components/ui/typography";
import { Button } from "@/shared/components/ui/button";

import { EditProductFormWrapper } from "@/features/seller/components/edit-product-form-wrapper";

export const metadata: Metadata = {
  title: "Manglara | Editar Producto",
};

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/seller/products">
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <TypographyH1>Editar producto</TypographyH1>
          <TypographyMuted>
            Modifica los detalles de tu producto
          </TypographyMuted>
        </div>
      </div>

      <EditProductFormWrapper productId={id} />
    </div>
  );
}
