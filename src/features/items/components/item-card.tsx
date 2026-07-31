"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  Wrench,
  ShoppingCart,
  MapPinIcon,
  ClockIcon,
  UsersIcon,
  HomeIcon,
  CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
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
import type { PublicItem } from "@/features/items/types";

const SERVICE_TYPE_LABELS: Record<string, string> = {
  accommodation: "Alojamiento",
  activity: "Actividad",
};

const PRICE_UNIT_LABELS: Record<string, string> = {
  night: "/noche",
  person: "/persona",
  day: "/día",
  flat_rate: "",
};

interface Props {
  item: PublicItem;
}

export function ItemCard({ item }: Props) {
  const imageUrl =
    item.images && item.images.length > 0 ? item.images[0] : null;
  const price = formatCurrency(item.price);

  const { addItem, cart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [open, setOpen] = useState(false);

  // For services, show enhanced card without cart functionality
  if (item.type !== "product") {
    const serviceItem = item;
    const serviceType = serviceItem.serviceType || "other";
    const priceUnit = serviceItem.priceUnit || "flat_rate";
    const config = (serviceItem.serviceConfig as Record<string, unknown>) ?? {};
    const location = serviceItem.location;
    const durationMinutes = serviceItem.durationMinutes;
    const maxCapacity = serviceItem.maxCapacity;

    return (
      <Link href={`/${item.type}s/${item.id}`}>
        <Card className="h-full transition-all hover:shadow-md">
          <CardHeader className="pb-2">
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
                  {serviceType === "accommodation" ? (
                    <HomeIcon className="h-12 w-12 text-muted-foreground" />
                  ) : serviceType === "activity" ? (
                    <CalendarIcon className="h-12 w-12 text-muted-foreground" />
                  ) : (
                    <Wrench className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
              )}
              {/* Badge de tipo en la imagen */}
              <Badge
                variant="secondary"
                className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm"
              >
                {SERVICE_TYPE_LABELS[serviceType]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <CardTitle className="line-clamp-2 text-lg">{item.name}</CardTitle>

            {item.description && (
              <CardDescription className="line-clamp-2">
                {item.description}
              </CardDescription>
            )}

            {/* Info rápida según tipo */}
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {location && (
                <span className="flex items-center gap-1">
                  <MapPinIcon className="h-3 w-3" />
                  <span className="line-clamp-1 max-w-[120px]">{location}</span>
                </span>
              )}
              {durationMinutes && (
                <span className="flex items-center gap-1">
                  <ClockIcon className="h-3 w-3" />
                  {durationMinutes} min
                </span>
              )}
              {maxCapacity && maxCapacity > 1 && (
                <span className="flex items-center gap-1">
                  <UsersIcon className="h-3 w-3" />
                  Hasta {maxCapacity} pers.
                </span>
              )}
              <span className="flex items-center gap-1 text-primary">
                <CalendarIcon className="h-3 w-3" />
                Consultar disponibilidad
              </span>
              {serviceType === "accommodation" && Boolean(config.bedrooms) && (
                <span className="flex items-center gap-1">
                  🛏️ {String(config.bedrooms)} hab.
                </span>
              )}
            </div>

            <div className="mt-auto flex items-center justify-between pt-2 border-t">
              <div>
                <span className="text-lg font-semibold">{price}</span>
                <span className="text-sm text-muted-foreground">
                  {PRICE_UNIT_LABELS[priceUnit]}
                </span>
              </div>
              <span className="text-xs text-muted-foreground line-clamp-1 max-w-[100px]">
                {item.organizationName}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  const product = item;
  const existingItem = cart.items.find(
    (cartItem) => cartItem.product.id === product.id,
  );
  const currentQuantity = existingItem?.quantity ?? 0;
  const availableStock =
    product.stock !== undefined ? product.stock - currentQuantity : undefined;
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
      toast.success(
        `${quantity} ${quantity === 1 ? "unidad" : "unidades"} agregada${quantity > 1 ? "s" : ""} al carrito`,
      );
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
        {product.stock !== undefined && product.stock <= 0 ? (
          <Button disabled className="w-full" size="sm">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Sin stock
          </Button>
        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                className="w-full"
                size="sm"
                onClick={(e) => e.stopPropagation()}
              >
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
                      {currentQuantity === 1 ? "unidad" : "unidades"} en el
                      carrito
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
        )}
      </div>
    </Card>
  );
}
