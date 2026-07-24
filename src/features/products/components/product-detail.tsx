"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon, Package, Plus, Minus, ShoppingCart, CalendarIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  TypographyH1,
  TypographyH3,
  TypographyMuted,
} from "@/shared/components/ui/typography";

import { useCart } from "@/features/cart/context/cart-context";
import { useProductAvailability } from "@/features/products/hooks/use-product-availability";
import { MapPreview } from "@/shared/components/map-preview";
import type { PublicProduct } from "@/features/products/types";

interface Props {
  product: PublicProduct;
}

function getTomorrowISODate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
}

export function ProductDetail({ product }: Props) {
  const { addItem, cart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [reservationDate, setReservationDate] = useState<string>("");

  const price = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(Number(product.price));

  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : null;

  // Para productos reservables: consultamos cuánto stock queda disponible
  // para la fecha elegida (el stock ya reservado por otros compradores en
  // esa misma fecha se descuenta del cálculo).
  const { data: availability, isLoading: isLoadingAvailability } = useProductAvailability(
    product.id,
    product.isReservable ? reservationDate || null : null,
  );

  const existingItem = cart.items.find(
    (item) =>
      item.product.id === product.id &&
      item.reservationDate === (product.isReservable ? reservationDate : undefined),
  );
  const currentQuantityInCart = existingItem?.quantity ?? 0;

  const availableStock = product.isReservable
    ? availability
      ? availability.availableQuantity - currentQuantityInCart
      : undefined
    : product.stock !== undefined
      ? product.stock - currentQuantityInCart
      : undefined;

  const maxQuantity = availableStock !== undefined ? Math.max(0, availableStock) : 999;

  const handleAddToCart = () => {
    if (quantity <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    if (product.isReservable && !reservationDate) {
      toast.error("Elige una fecha para tu reserva");
      return;
    }

    if (availableStock !== undefined && quantity > availableStock) {
      toast.error(`Solo hay ${availableStock} unidades disponibles para esa fecha`);
      return;
    }

    const success = addItem(product, quantity, product.isReservable ? reservationDate : undefined);
    if (success) {
      toast.success(
        product.isReservable
          ? `Reserva agregada al carrito para el ${new Date(
              reservationDate + "T00:00:00",
            ).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`
          : `${quantity} ${quantity === 1 ? "unidad" : "unidades"} agregada${quantity > 1 ? "s" : ""} al carrito`,
      );
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

  const isOutOfStock =
    !product.isReservable && product.stock !== undefined && product.stock <= 0;

  const canAddToCart = product.isReservable
    ? Boolean(reservationDate) && availableStock !== undefined && availableStock > 0
    : availableStock === undefined || availableStock > 0;

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
              {product.isReservable && (
                <Badge variant="secondary">
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  Requiere reserva
                </Badge>
              )}
            </div>
            <TypographyMuted className="text-sm">
              Por {product.sellerName} · {product.organizationName}
            </TypographyMuted>
          </div>

          <div className="space-y-4">
            <div>
              <TypographyH3 className="text-3xl">{price}</TypographyH3>
              {!product.isReservable && product.stock !== undefined && (
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
              {product.isReservable && (
                <div className="space-y-2">
                  <Label htmlFor="reservationDate">Fecha de la reserva</Label>
                  <Input
                    id="reservationDate"
                    type="date"
                    min={getTomorrowISODate()}
                    value={reservationDate}
                    onChange={(e) => {
                      setReservationDate(e.target.value);
                      setQuantity(1);
                    }}
                  />
                  {reservationDate && (
                    <TypographyMuted className="text-sm">
                      {isLoadingAvailability
                        ? "Consultando disponibilidad..."
                        : availability
                          ? availability.availableQuantity > 0
                            ? `${availability.availableQuantity} disponibles para esa fecha`
                            : "Sin disponibilidad para esa fecha"
                          : null}
                    </TypographyMuted>
                  )}
                </div>
              )}

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
                {!product.isReservable && availableStock !== undefined && (
                  <TypographyMuted className="text-sm">
                    {availableStock > 0
                      ? `${availableStock} disponibles`
                      : "Sin stock"}
                  </TypographyMuted>
                )}
              </div>

              {isOutOfStock ? (
                <Button disabled className="w-full" size="lg">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Sin stock
                </Button>
              ) : (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={!canAddToCart}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {product.isReservable ? "Reservar" : "Agregar al carrito"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
