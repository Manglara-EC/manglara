"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, Package, Wrench, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
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
import { formatCurrency } from "@/shared/utils/currency";
import { getValidImageSrc } from "@/shared/utils/image-src";
import type { PublicItem } from "@/features/items/types";

interface Props {
  item: PublicItem;
}

export function ItemCardWithCart({ item }: Props) {
  const imageUrl = getValidImageSrc(item.images?.[0]);
  const price = formatCurrency(item.price);

  const { addItem, cart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [open, setOpen] = useState(false);

  // Only show cart button for products
  if (item.type !== "product") {
    return (
      <Card className="h-full transition-all hover:shadow-md">
        <Link href={`/${item.type}s/${item.id}`}>
          <CardHeader>
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Wrench className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="line-clamp-2 text-lg">{item.name}</CardTitle>
              <Badge variant="secondary">Servicio</Badge>
            </div>
            {item.description && (
              <CardDescription className="line-clamp-2">
                {item.description}
              </CardDescription>
            )}
            <div className="mt-auto flex items-center justify-between pt-2">
              <span className="text-lg font-semibold">{price}</span>
              <span className="text-sm text-muted-foreground">
                {item.organizationName}
              </span>
            </div>
          </CardContent>
        </Link>
        <div className="px-6 pb-6">
          <Button asChild className="w-full" size="sm">
            <Link href={`/${item.type}s/${item.id}`}>
              Ver detalles
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Card>
    );
  }

  // Product card with cart functionality
  const product = item; // Type assertion for product
  const existingItem = cart.items.find(
    (cartItem) =>
      cartItem.type === "product" && cartItem.product.id === product.id,
  );
  const currentQuantity = existingItem?.quantity ?? 0;
  const availableStock = product.stock !== undefined ? product.stock - currentQuantity : undefined;
  const maxQuantity = availableStock !== undefined ? availableStock : 999;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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
      toast.success(`${quantity} ${quantity === 1 ? "unidad" : "unidades"} agregada${quantity > 1 ? "s" : ""} al carrito`);
      setOpen(false);
      setQuantity(1);
    } else {
      toast.error("No hay suficiente stock disponible");
    }
  };

  return (
    <Card className="h-full transition-all hover:shadow-md">
      <Link href={`/products/${item.id}`}>
        <CardHeader>
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={item.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Package className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 text-lg">{item.name}</CardTitle>
            <Badge>Producto</Badge>
          </div>
          {item.description && (
            <CardDescription className="line-clamp-2">
              {item.description}
            </CardDescription>
          )}
          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="text-lg font-semibold">{price}</span>
            <span className="text-sm text-muted-foreground">
              {item.organizationName}
            </span>
          </div>
        </CardContent>
      </Link>
      <div className="px-6 pb-6" onClick={(e) => e.stopPropagation()}>
        {product.isReservable ? (
          <Link href={`/products/${item.id}`} className="block">
            <Button className="w-full" size="sm" variant="secondary">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Ver fechas y reservar
            </Button>
          </Link>
        ) : product.stock !== undefined && product.stock <= 0 ? (
          <Button disabled className="w-full" size="sm">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Sin stock
          </Button>
        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" size="sm" onClick={(e) => e.stopPropagation()}>
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
                      Ya tienes {currentQuantity} {currentQuantity === 1 ? "unidad" : "unidades"} en el carrito
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddToCart} disabled={availableStock !== undefined && availableStock <= 0}>
                  Agregar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Card>
  );
}
