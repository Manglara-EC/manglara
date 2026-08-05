"use server";

import { headers } from "next/headers";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/shared/lib/drizzle/server";
import { auth } from "@/shared/lib/better-auth/server";
import { product as productTable, request } from "@/shared/lib/drizzle/schema";
import {
  bookingLine,
  parentOrder,
  productLine,
  transactionHeader,
  transactionLine,
} from "@/shared/lib/drizzle/transactions";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";
import { validateBookingAvailability } from "@/features/services/data/booking-availability";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const cartInputSchema = z
  .array(
    z.discriminatedUnion("type", [
      z.object({
        type: z.literal("product"),
        product: z.object({ id: z.string().min(1) }).passthrough(),
        quantity: z.number().int().positive(),
        // Solo aplica a productos reservables (product.isReservable === true).
        reservationDate: z.string().regex(DATE_REGEX).optional(),
      }),
      z.object({
        type: z.literal("booking"),
        serviceId: z.string().min(1),
        startDate: z.string().datetime({ offset: true }),
        endDate: z.string().datetime({ offset: true }),
        quantity: z.number().int().positive(),
        notes: z.string().max(2_000).optional(),
      }),
    ]),
  )
  .min(1);

type CheckoutItem = z.infer<typeof cartInputSchema>[number];

type ErrorCode =
  | "UNAUTHORIZED"
  | "CART_EMPTY"
  | "INVALID_CART"
  | "PRODUCT_NOT_FOUND"
  | "SERVICE_NOT_FOUND"
  | "INSUFFICIENT_STOCK"
  | "RESERVATION_DATE_REQUIRED"
  | "DATE_NOT_AVAILABLE"
  | "INVALID_DATES"
  | "UNAVAILABLE"
  | "CAPACITY_EXCEEDED"
  | "INTERNAL_SERVER_ERROR";

class CheckoutError extends Error {
  constructor(
    readonly code: Exclude<
      ErrorCode,
      "UNAUTHORIZED" | "CART_EMPTY" | "INTERNAL_SERVER_ERROR"
    >,
    message: string,
  ) {
    super(message);
  }
}

const toAmount = (amount: number) => Math.round(amount * 100) / 100;

const calculateBookingTotal = (
  service: { price: string; serviceType: string; priceUnit: string },
  startDate: Date,
  endDate: Date,
  quantity: number,
) => {
  const duration = endDate.getTime() - startDate.getTime();
  const basePrice = Number(service.price);
  let units = 1;

  if (service.serviceType === "accommodation" || service.priceUnit === "day") {
    units = Math.max(1, Math.ceil(duration / 86_400_000));
  } else if (service.priceUnit === "hour") {
    units = Math.max(1, Math.ceil(duration / 3_600_000));
  }

  return toAmount(basePrice * units * quantity);
};

export const simulatePurchase = async (
  rawItems: unknown,
): Promise<ActionResponse<{ transactionId: string }, ErrorCode>> => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return {
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Debes iniciar sesión para realizar una compra.",
      },
    };
  }

  const parsedItems = cartInputSchema.safeParse(rawItems);
  if (!parsedItems.success) {
    return {
      data: null,
      error: {
        code:
          Array.isArray(rawItems) && rawItems.length === 0
            ? "CART_EMPTY"
            : "INVALID_CART",
        message:
          Array.isArray(rawItems) && rawItems.length === 0
            ? "El carrito está vacío."
            : "El carrito contiene datos inválidos.",
      },
    };
  }

  const items = parsedItems.data;
  const now = new Date();
  for (const item of items) {
    if (item.type !== "booking") continue;

    const startDate = new Date(item.startDate);
    const endDate = new Date(item.endDate);
    if (startDate <= now || endDate <= startDate) {
      return {
        data: null,
        error: {
          code: "INVALID_DATES",
          message:
            "Las reservas deben tener fechas futuras y una fecha de fin posterior al inicio.",
        },
      };
    }
  }

  const { data: transactionResult, error: transactionError } = await tryCatch(
    db.transaction(async (tx) => {
      const productItems = items.filter(
        (item): item is Extract<CheckoutItem, { type: "product" }> =>
          item.type === "product",
      );
      const productIds = [
        ...new Set(productItems.map((item) => item.product.id)),
      ].sort();
      const products = productIds.length
        ? await tx
            .select()
            .from(productTable)
            .where(
              and(
                inArray(productTable.id, productIds),
                eq(productTable.status, "approved"),
                eq(productTable.deleted, false),
              ),
            )
            .for("update")
        : [];
      const productsById = new Map(
        products.map((product) => [product.id, product]),
      );
      const productQuantities = new Map<string, number>();
      for (const item of productItems) {
        productQuantities.set(
          item.product.id,
          (productQuantities.get(item.product.id) ?? 0) + item.quantity,
        );
      }

      // Suma de cantidades pedidas dentro de este mismo carrito, agrupadas
      // por producto + fecha, para validar la disponibilidad de ese día
      // aunque el carrito tenga más de una línea para la misma fecha.
      const requestedPerProductDate = new Map<string, number>();

      const resolvedItems: Array<
        | {
            type: "product";
            item: Extract<CheckoutItem, { type: "product" }>;
            sellerId: string;
            unitPrice: number;
            total: number;
            productId: string;
            isReservable: boolean;
            reservationDate?: string;
          }
        | {
            type: "booking";
            item: Extract<CheckoutItem, { type: "booking" }>;
            sellerId: string;
            unitPrice: number;
            total: number;
            serviceId: string;
            startDate: Date;
            endDate: Date;
          }
      > = [];

      for (const item of productItems) {
        const product = productsById.get(item.product.id);
        if (!product) {
          throw new CheckoutError(
            "PRODUCT_NOT_FOUND",
            "Un producto ya no está disponible.",
          );
        }

        if (product.isReservable) {
          // Productos reservables: la fecha es obligatoria y el stock se
          // valida por día (más abajo), no de forma global.
          if (!item.reservationDate) {
            throw new CheckoutError(
              "RESERVATION_DATE_REQUIRED",
              `Elige una fecha de reserva para ${product.name}.`,
            );
          }

          const key = `${product.id}__${item.reservationDate}`;
          requestedPerProductDate.set(
            key,
            (requestedPerProductDate.get(key) ?? 0) + item.quantity,
          );
        } else if (product.stock < productQuantities.get(product.id)!) {
          throw new CheckoutError(
            "INSUFFICIENT_STOCK",
            `Stock insuficiente para ${product.name}. Disponible: ${product.stock}.`,
          );
        }

        resolvedItems.push({
          type: "product",
          item,
          sellerId: product.sellerId,
          unitPrice: Number(product.price),
          total: toAmount(Number(product.price) * item.quantity),
          productId: product.id,
          isReservable: product.isReservable,
          reservationDate: item.reservationDate,
        });
      }

      // Validar disponibilidad por fecha para productos reservables. El
      // bloqueo `for("update")` sobre `product` de arriba ya sirve para
      // serializar reservas concurrentes del mismo producto.
      for (const [key, requestedQuantity] of requestedPerProductDate.entries()) {
        const [productId, date] = key.split("__");
        const product = productsById.get(productId)!;

        const bookedQuantity = await getBookedQuantityForDate(tx, productId, date);

        if (bookedQuantity + requestedQuantity > product.stock) {
          const remaining = Math.max(0, product.stock - bookedQuantity);
          throw new CheckoutError(
            "DATE_NOT_AVAILABLE",
            `Solo quedan ${remaining} unidades de ${product.name} disponibles para el ${date}.`,
          );
        }
      }

      const bookingItems = items
        .filter(
          (item): item is Extract<CheckoutItem, { type: "booking" }> =>
            item.type === "booking",
        )
        .toSorted((left, right) =>
          left.serviceId.localeCompare(right.serviceId),
        );
      const pendingBookings: Array<{
        serviceId: string;
        startDate: Date;
        endDate: Date;
        quantity: number;
      }> = [];

      for (const item of bookingItems) {
        const startDate = new Date(item.startDate);
        const endDate = new Date(item.endDate);
        const availability = await validateBookingAvailability(tx, {
          serviceId: item.serviceId,
          startDate,
          endDate,
          quantity: item.quantity,
        });
        if (!availability.available) {
          throw new CheckoutError(availability.code, availability.message);
        }

        const pendingQuantity = pendingBookings
          .filter(
            (booking) =>
              booking.serviceId === item.serviceId &&
              booking.startDate < endDate &&
              booking.endDate > startDate,
          )
          .reduce((total, booking) => total + booking.quantity, 0);
        if (
          (availability.service.serviceType === "accommodation" &&
            pendingQuantity > 0) ||
          pendingQuantity + item.quantity > availability.availableCapacity
        ) {
          throw new CheckoutError(
            "CAPACITY_EXCEEDED",
            "No hay suficiente disponibilidad para las reservas seleccionadas.",
          );
        }
        pendingBookings.push({
          serviceId: item.serviceId,
          startDate,
          endDate,
          quantity: item.quantity,
        });

        const total = calculateBookingTotal(
          availability.service,
          startDate,
          endDate,
          item.quantity,
        );
        resolvedItems.push({
          type: "booking",
          item,
          sellerId: availability.service.sellerId,
          unitPrice: toAmount(total / item.quantity),
          total,
          serviceId: availability.service.id,
          startDate,
          endDate,
        });
      }

      const parentOrderId = crypto.randomUUID();
      const grandTotal = toAmount(
        resolvedItems.reduce((total, item) => total + item.total, 0),
      );
      await tx.insert(parentOrder).values({
        id: parentOrderId,
        customerId: session.user.id,
        totalAmount: grandTotal.toFixed(2),
        status: "completed",
        createdAt: new Date(),
      });

      const itemsBySeller = new Map<string, typeof resolvedItems>();
      for (const item of resolvedItems) {
        const sellerItems = itemsBySeller.get(item.sellerId) ?? [];
        sellerItems.push(item);
        itemsBySeller.set(item.sellerId, sellerItems);
      }

      const transactionIds: string[] = [];
      for (const [sellerId, sellerItems] of itemsBySeller) {
        const transactionId = crypto.randomUUID();
        const sellerTotal = toAmount(
          sellerItems.reduce((total, item) => total + item.total, 0),
        );
        await tx.insert(transactionHeader).values({
          id: transactionId,
          parentOrderId,
          sellerId,
          customerId: session.user.id,
          totalAmount: sellerTotal.toFixed(2),
          status: "completed",
          createdAt: new Date(),
        });
        transactionIds.push(transactionId);

        for (const item of sellerItems) {
          const transactionLineId = crypto.randomUUID();
          await tx.insert(transactionLine).values({
            id: transactionLineId,
            transactionId,
            // Un producto reservable también se registra como "booking" a
            // nivel de línea de transacción, para que quede claro que su
            // detalle vive en booking_line y no en product_line.
            type:
              item.type === "product" && item.isReservable
                ? "booking"
                : item.type,
            unitPrice: item.unitPrice.toFixed(2),
            quantity: item.item.quantity,
            discount: "0",
            taxes: "0",
            totalAmount: item.total.toFixed(2),
            createdAt: new Date(),
          });

          if (item.type === "product") {
            if (item.isReservable) {
              // El stock NO se descuenta globalmente aquí: ya se validó que
              // hay cupo para esta fecha específica (ver arriba).
              const reservationDate = new Date(`${item.reservationDate}T00:00:00`);
              await tx.insert(bookingLine).values({
                transactionLineId,
                productId: item.productId,
                serviceId: null,
                userId: session.user.id,
                startDate: reservationDate,
                endDate: reservationDate,
              }as any);
            } else {
              await tx.insert(productLine).values({
                transactionLineId,
                productId: item.productId,
              });
            }
          } else {
            await tx.insert(bookingLine).values({
              transactionLineId,
              serviceId: item.serviceId,
              userId: session.user.id,
              startDate: item.startDate,
              endDate: item.endDate,
              notes: item.item.notes || null,
            });
          }
        }

        await tx.insert(request).values({
          id: crypto.randomUUID(),
          userId: sellerId,
          type: "purchase_completed",
          message: `Nueva compra de ${session.user.name || session.user.email}. Total: ${new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(sellerTotal)}`,
          read: false,
          referenceType: "order",
          createdAt: new Date(),
        });
      }

      // Actualizar stock solo para productos NO reservables. El stock de un
      // producto reservable representa la capacidad diaria compartida, no
      // un inventario que se consume por compra.
      for (const [productId, quantity] of productQuantities) {
        const product = productsById.get(productId)!;
        if (product.isReservable) continue;

        await tx
          .update(productTable)
          .set({
            stock: product.stock - quantity,
            updatedAt: new Date(),
          })
          .where(eq(productTable.id, productId));
      }

      return { transactionId: transactionIds[0] };
    }),
  );

  if (transactionError instanceof CheckoutError) {
    return {
      data: null,
      error: { code: transactionError.code, message: transactionError.message },
    };
  }

  if (transactionError || !transactionResult) {
    console.error("Checkout error:", transactionError);
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al procesar la compra. Por favor, intenta de nuevo.",
      },
    };
  }

  return { data: transactionResult, error: null };
};