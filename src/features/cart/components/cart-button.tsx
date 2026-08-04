"use client";

import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { useCart } from "@/features/cart/context/cart-context";
import { CartItemCount } from "@/features/cart/components/cart-button/cart-item-count";

export function CartButton() {
  const router = useRouter();
  const { getTotalItems } = useCart();
  const totalItems = getTotalItems();

  const handleClick = () => {
    router.push("/cart");
  };

  return (
    <Button
      variant="outline"
      className="relative h-10 gap-2 border-primary/40 bg-background px-4 text-primary shadow-sm hover:bg-primary hover:text-primary-foreground"
      onClick={handleClick}
    >
      <ShoppingCart className="h-4 w-4" />
      Carrito
      {totalItems > 0 && <CartItemCount totalItems={totalItems} />}
    </Button>
  );
}
