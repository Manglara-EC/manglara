"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { Package, LoaderIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { ScrollArea } from "@/shared/components/ui/scroll-area";

import { useCart } from "@/features/cart/context/cart-context";
import { simulatePurchase } from "@/features/cart/actions/simulate-purchase";

export function CheckoutSummary() {
  const router = useRouter();
  const { cart, getTotalPrice, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);

  const totalPrice = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(getTotalPrice());

  const handleSimulatePurchase = async () => {
    if (cart.items.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await simulatePurchase(cart.items);

      if (error) {
        toast.error(error.message || "Error al procesar la compra");
        setIsProcessing(false);
        return;
      }

      if (data) {
        toast.success("¡Compra realizada con éxito!");
        clearCart();
        router.push("/home");
      }
    } catch (err) {
      toast.error("Error inesperado al procesar la compra");
      setIsProcessing(false);
    }
  };

  if (cart.items.length === 0) {
    router.push("/cart");
    return null;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Productos seleccionados</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-4">
                {cart.items.map((item) => {
                  const imageUrl =
                    item.product.images && item.product.images.length > 0
                      ? item.product.images[0]
                      : null;
                  const price = new Intl.NumberFormat("es-ES", {
                    style: "currency",
                    currency: "EUR",
                  }).format(Number(item.product.price));
                  const itemTotal = new Intl.NumberFormat("es-ES", {
                    style: "currency",
                    currency: "EUR",
                  }).format(Number(item.product.price) * item.quantity);

                  return (
                    <div key={item.product.id} className="space-y-4">
                      <div className="flex gap-4">
                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
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
                        <div className="flex flex-1 flex-col gap-1">
                          <p className="font-medium text-lg">{item.product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {price} × {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{itemTotal}</p>
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
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {cart.items.map((item) => {
                const itemTotal = Number(item.product.price) * item.quantity;
                const itemTotalFormatted = new Intl.NumberFormat("es-ES", {
                  style: "currency",
                  currency: "EUR",
                }).format(itemTotal);

                return (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.product.name} (×{item.quantity})
                    </span>
                    <span>{itemTotalFormatted}</span>
                  </div>
                );
              })}
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-lg font-semibold">{totalPrice}</span>
              </div>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={handleSimulatePurchase}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Simular compra"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
