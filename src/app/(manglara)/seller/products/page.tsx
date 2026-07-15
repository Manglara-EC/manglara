import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import {
  TypographyH1,
  TypographyMuted,
} from "@/shared/components/ui/typography";
import { Button } from "@/shared/components/ui/button";
import { MyProductsList } from "@/features/seller/components/my-products-list";

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
      <MyProductsList />
    </div>
  );
}
