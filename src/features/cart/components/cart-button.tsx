"use client";

import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";

import { useCart } from "@/features/cart/context/cart-context";

export function CartButton() {
  const router = useRouter();
  const { getTotalItems } = useCart();

  const handleClick = () => {
    router.push("/cart");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={handleClick}
    >
      <ShoppingCart className="h-5 w-5" />
      {getTotalItems() > 0 && (
        <Badge
          variant="destructive"
          className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
        >
          {getTotalItems()}
        </Badge>
      )}
    </Button>
  );
}
