import type { Metadata } from "next";

import {
  TypographyH1,
  TypographyMuted,
} from "@/shared/components/ui/typography";

import { CartView } from "@/features/cart/components/cart-view";

export const metadata: Metadata = {
  title: "Manglara | Carrito",
};

export default function CartPage() {
  return (
    <main className="flex flex-col gap-6">
      <div className="space-y-2">
        <TypographyH1>Carrito de compras</TypographyH1>
        <TypographyMuted>Revisa tus productos antes de proceder al pago</TypographyMuted>
      </div>

      <CartView />
    </main>
  );
}
