"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

import { useCart } from "@/features/cart/context/cart-context";
import type { PublicProduct } from "@/features/products/types";

interface Props {
  product: PublicProduct;
}

export function AddToCartButton({ product }: Props) {
  const { addItem, cart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [open, setOpen] = useState(false);

  const existingItem = cart.items.find(
    (item) => item.product.id === product.id,
  );
  const currentQuantity = existingItem?.quantity ?? 0;
  const availableStock =
    product.stock !== undefined ? product.stock - currentQuantity : undefined;
  const maxQuantity = availableStock !== undefined ? availableStock : 999;

  const handleAddToCart = () => {
    if (quantity <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    if (availableStock !== undefined && quantity > availableStock) {
      toast.error(`Solo hay ${availableStock} unidades disponibles`);
      return;
    }

    const success = addItem(product, quantity);
    if (success) {
      toast.success(
        `${quantity} ${quantity === 1 ? "unidad" : "unidades"} agregada${quantity > 1 ? "s" : ""} al carrito`,
      );
      setOpen(false);
      setQuantity(1);
    } else {
      toast.error("No hay suficiente stock disponible");
    }
  };

  if (product.stock !== undefined && product.stock <= 0) {
    return (
      <Button disabled className="w-full">
        <ShoppingCart className="mr-2 h-4 w-4" />
        Sin stock
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Agregar al carrito
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar al carrito</DialogTitle>
          <DialogDescription>
            Selecciona la cantidad que deseas agregar
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Cantidad</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={maxQuantity}
              value={quantity}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value >= 1 && value <= maxQuantity) {
                  setQuantity(value);
                }
              }}
            />
            {availableStock !== undefined && (
              <p className="text-sm text-muted-foreground">
                {availableStock > 0
                  ? `${availableStock} unidades disponibles`
                  : "Sin stock disponible"}
              </p>
            )}
            {currentQuantity > 0 && (
              <p className="text-sm text-muted-foreground">
                Ya tienes {currentQuantity}{" "}
                {currentQuantity === 1 ? "unidad" : "unidades"} en el carrito
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleAddToCart}
            disabled={availableStock !== undefined && availableStock <= 0}
          >
            Agregar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
