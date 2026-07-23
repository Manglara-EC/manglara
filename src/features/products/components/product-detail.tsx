"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon, Package, Plus, Minus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import {
  TypographyH1,
  TypographyH3,
  TypographyMuted,
} from "@/shared/components/ui/typography";

import { useCart } from "@/features/cart/context/cart-context";
import { MapPreview } from "@/shared/components/map-preview";
import type { PublicProduct } from "@/features/products/types";

interface Props {
  product: PublicProduct;
}

export function ProductDetail({ product }: Props) {
  const { addItem, cart } = useCart();
  const [quantity, setQuantity] = useState(1);

  const price = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(Number(product.price));

  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : null;

  const existingItem = cart.items.find((item) => item.product.id === product.id);
  const currentQuantity = existingItem?.quantity ?? 0;
  const availableStock = product.stock !== undefined ? product.stock - currentQuantity : undefined;
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
      toast.success(`${quantity} ${quantity === 1 ? "unidad" : "unidades"} agregada${quantity > 1 ? "s" : ""} al carrito`);
      setQuantity(1);
    } else {
      toast.error("No hay suficiente stock disponible");
    }
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncreaseQuantity = () => {
    if (quantity < maxQuantity) {
      setQuantity(quantity + 1);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Link href="/explore">
        <Button variant="ghost" size="sm" className="w-fit">
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Volver a explorar
        </Button>
      </Link>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Package className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TypographyH1>{product.name}</TypographyH1>
              <Badge>Producto</Badge>
            </div>
            <TypographyMuted className="text-sm">
              Por {product.sellerName} · {product.organizationName}
            </TypographyMuted>
          </div>

          <div className="space-y-4">
            <div>
              <TypographyH3 className="text-3xl">{price}</TypographyH3>
              {product.stock !== undefined && (
                <TypographyMuted className="text-sm">
                  Stock disponible: {product.stock}
                </TypographyMuted>
              )}
            </div>

            {product.description && (
              <div className="space-y-2">
                <TypographyH3>Descripción</TypographyH3>
                <TypographyMuted className="whitespace-pre-wrap">
                  {product.description}
                </TypographyMuted>
              </div>
            )}

            <MapPreview
              latitude={product.latitude}
              longitude={product.longitude}
              label={product.location}
            />

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <TypographyH3 className="text-sm">Cantidad:</TypographyH3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    onClick={handleDecreaseQuantity}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center text-lg font-semibold">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    onClick={handleIncreaseQuantity}
                    disabled={availableStock !== undefined && quantity >= availableStock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {availableStock !== undefined && (
                  <TypographyMuted className="text-sm">
                    {availableStock > 0
                      ? `${availableStock} disponibles`
                      : "Sin stock"}
                  </TypographyMuted>
                )}
              </div>

              {product.stock !== undefined && product.stock <= 0 ? (
                <Button disabled className="w-full" size="lg">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Sin stock
                </Button>
              ) : (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={availableStock !== undefined && availableStock <= 0}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Agregar al carrito
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
