"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  CalendarDays,
  Package,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { ScrollArea } from "@/shared/components/ui/scroll-area";

import { useCart } from "@/features/cart/context/cart-context";
import { formatCurrency } from "@/shared/utils/currency";
import { getValidImageSrc } from "@/shared/utils/image-src";

export function CartView() {
  const router = useRouter();
  const { cart, updateQuantity, removeItem, getTotalPrice } = useCart();

  const totalPrice = formatCurrency(getTotalPrice());

  const handleProceedToCheckout = () => {
    if (cart.items.length === 0) return;
    router.push("/checkout");
  };

  if (cart.items.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-4 py-12">
        <Package className="h-16 w-16 text-muted-foreground" />
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">Tu carrito está vacío</p>
          <p className="text-sm text-muted-foreground">
            Agrega productos a tu carrito para continuar
          </p>
        </div>
        <Link href="/explore">
          <Button>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Explorar productos
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="p-6">
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-4">
                {cart.items.map((item) => {
                  if (item.type === "booking") {
                    const serviceImage = getValidImageSrc(item.serviceImage);

                    return (
                      <div key={item.id} className="space-y-4">
                        <div className="flex gap-4">
                          <Link href={`/services/${item.serviceId}`}>
                            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                              {serviceImage ? (
                                <Image
                                  src={serviceImage}
                                  alt={item.serviceName}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <CalendarDays className="h-8 w-8 text-muted-foreground" />
                              )}
                            </div>
                          </Link>
                          <div className="flex flex-1 flex-col gap-1">
                            <Link href={`/services/${item.serviceId}`}>
                              <p className="text-lg font-medium hover:underline">
                                {item.serviceName}
                              </p>
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {format(
                                new Date(item.startDate),
                                "dd MMM yyyy, HH:mm",
                                { locale: es },
                              )}{" "}
                              -{" "}
                              {format(
                                new Date(item.endDate),
                                "dd MMM yyyy, HH:mm",
                                { locale: es },
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity}{" "}
                              {item.quantity === 1 ? "persona" : "personas"}
                            </p>
                            {item.notes && (
                              <p className="line-clamp-1 text-xs text-muted-foreground">
                                Nota: {item.notes}
                              </p>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="mt-1 h-8 w-8 text-destructive"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar reserva</span>
                            </Button>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold">
                              {formatCurrency(item.estimatedTotal)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Estimado
                            </p>
                          </div>
                        </div>
                        <Separator />
                      </div>
                    );
                  }

                  const imageUrl = getValidImageSrc(item.product.images?.[0]);
                  const price = formatCurrency(item.product.price);
                  const itemTotal = formatCurrency(
                    Number(item.product.price) * item.quantity,
                  );

                  return (
                    <div key={item.id} className="space-y-4">
                      <div className="flex gap-4">
                        <Link href={`/products/${item.product.id}`}>
                          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                            {imageUrl ? (
                              <Image
                                src={imageUrl}
                                alt={item.product.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <Package className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </Link>
                        <div className="flex flex-1 flex-col gap-2">
                          <Link href={`/products/${item.product.id}`}>
                            <p className="font-medium hover:underline text-lg">
                              {item.product.name}
                            </p>
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            {price} cada uno
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.quantity - 1,
                                )
                              }
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.quantity + 1,
                                )
                              }
                              disabled={
                                item.product.stock !== undefined &&
                                item.quantity >= item.product.stock
                              }
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 ml-auto text-destructive"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">{itemTotal}</p>
                        </div>
                      </div>
                      <Separator />
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{totalPrice}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-lg font-semibold">{totalPrice}</span>
              </div>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={handleProceedToCheckout}
            >
              Proceder al pago
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
