import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  TypographyH1,
  TypographyMuted,
} from "@/shared/components/ui/typography";

import { CheckoutSummary } from "@/features/cart/components/checkout-summary";

export const metadata: Metadata = {
  title: "Manglara | Checkout",
};

export default function CheckoutPage() {
  return (
    <main className="flex flex-col gap-6">
      <div className="space-y-2">
        <TypographyH1>Resumen de compra</TypographyH1>
        <TypographyMuted>Revisa tu pedido antes de confirmar</TypographyMuted>
      </div>

      <CheckoutSummary />
    </main>
  );
}
