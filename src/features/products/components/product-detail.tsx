"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeftIcon,
  Package,
  Plus,
  Minus,
  ShoppingCart,
  Maximize2,
  CalendarIcon
} from "lucide-react";
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
import { formatCurrency } from "@/shared/utils/currency";
import { getValidImageSources } from "@/shared/utils/image-src";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/shared/components/ui/carousel";

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(1);

  const price = formatCurrency(product.price);

  const images = getValidImageSources(product.images);
  const imageUrl = images.length > 0 ? images[0] : null;
  // Para productos reservables: consultamos cuánto stock queda disponible
  // para la fecha elegida (el stock ya reservado por otros compradores en
  // esa misma fecha se descuenta del cálculo).
  const { data: availability, isLoading: isLoadingAvailability } = useProductAvailability(
    product.id,
    product.isReservable ? reservationDate || null : null,
  );

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap() + 1);
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  const openModal = (index: number = 0) => {
    setSelectedImageIndex(index);
    setIsModalOpen(true);
  };

  const currentCartItemId = product.isReservable
    ? reservationDate
      ? `${product.id}::${reservationDate}`
      : null
    : product.id;

  const existingItem = cart.items.find(
    (item) =>
      item.type === "product" && item.product.id === product.id
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
    if (product.isReservable && !reservationDate) {
      toast.error("Elige una fecha para tu reserva");
      return;
    }

    if (quantity <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    if (availableStock !== undefined && quantity > availableStock) {
      toast.error(`Solo hay ${availableStock} unidades disponibles`);
      return;
    }

    const success = addItem(product, quantity, product.isReservable ? reservationDate : undefined);
    if (success) {
      toast.success(
        product.isReservable
          ? `Reserva agregada al carrito para el ${new Date(
            reservationDate + "T00:00:00",
          ).toLocaleDateString("es-ES", {
            day: "numeric", month: "long", year: "numeric"
          })}`
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
        <Card className="overflow-hidden">
          <CardHeader className="p-4 sm:p-6">
            <div className="group relative aspect-square w-full cursor-pointer overflow-hidden rounded-lg bg-muted"
              onClick={() => imageUrl && openModal(0)}>
              {imageUrl ? (
                <>
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="secondary" size="sm" className="gap-2">
                      <Maximize2 className="h-4 w-4" />
                      Ver galería ({images.length})
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Package className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>
          </CardHeader>

          {images.length > 1 && (
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <div className="flex flex-wrap gap-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => openModal(index)}
                    className="relative aspect-square w-16 overflow-hidden rounded-md border-2 border-transparent hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    <Image
                      src={img}
                      alt={`${product.name} miniatura ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </CardContent>
          )}

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
                    disabled={
                      availableStock !== undefined && quantity >= availableStock
                    }
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
                  disabled={availableStock !== undefined && availableStock <= 0}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {product.isReservable ? "Reservar" : "Agregar al carrito"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal con Carrusel de Imágenes */}
      {
        images.length > 0 && (
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-4xl w-[95vw] border-none bg-black/95 p-4 text-white sm:p-6">
              <DialogHeader className="flex flex-row items-center justify-between">
                <DialogTitle className="text-base text-white">
                  {product.name} ({current} de {images.length})
                </DialogTitle>
              </DialogHeader>

              <div className="relative flex items-center justify-center px-8 py-4 sm:px-12">
                <Carousel
                  setApi={setApi}
                  opts={{
                    startIndex: selectedImageIndex,
                    loop: true,
                  }}
                  className="w-full max-w-2xl"
                >
                  <CarouselContent>
                    {images.map((imgUrl, idx) => (
                      <CarouselItem
                        key={idx}
                        className="flex items-center justify-center"
                      >
                        <div className="relative aspect-4/3 max-h-[70vh] w-full overflow-hidden rounded-lg">
                          <Image
                            src={imgUrl}
                            alt={`${product.name} - Imagen ${idx + 1}`}
                            fill
                            className="object-contain"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {images.length > 1 && (
                    <>
                      <CarouselPrevious className="-left-4 bg-background/80 text-foreground hover:bg-background sm:-left-8" />
                      <CarouselNext className="-right-4 bg-background/80 text-foreground hover:bg-background sm:-right-8" />
                    </>
                  )}
                </Carousel>
              </div>
            </DialogContent>
          </Dialog>
        )
      }
    </div >
  );
}
