"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/shared/lib/drizzle/server";
import { auth } from "@/shared/lib/better-auth/server";
import { product as productTable, request } from "@/shared/lib/drizzle/schema";
import {
  parentOrder,
  transactionHeader,
  transactionLine,
  productLine,
  bookingLine,
} from "@/shared/lib/drizzle/transactions";
import { getBookedQuantityForDate } from "@/features/products/lib/availability";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";
import type { CartItem } from "@/features/cart/types";

type ErrorCode =
  | "UNAUTHORIZED"
  | "CART_EMPTY"
  | "PRODUCT_NOT_FOUND"
  | "INSUFFICIENT_STOCK"
  | "INVALID_QUANTITY"
  | "PRICE_MISMATCH"
  | "RESERVATION_DATE_REQUIRED"
  | "DATE_NOT_AVAILABLE"
  | "INTERNAL_SERVER_ERROR";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const simulatePurchase = async (
  items: CartItem[],
): Promise<ActionResponse<{ transactionId: string }, ErrorCode>> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Debes iniciar sesión para realizar una compra",
      },
    };
  }

  if (!items || items.length === 0) {
    return {
      data: null,
      error: {
        code: "CART_EMPTY",
        message: "El carrito está vacío",
      },
    };
  }

  // Validate all items and fetch current product data
  const productIds = items.map((item) => item.product.id);
  const { data: products, error: productsError } = await tryCatch(
    db.query.product.findMany({
      where: (product, { inArray, eq, and }) =>
        and(
          inArray(product.id, productIds),
          eq(product.status, "approved"),
          eq(product.deleted, false),
        ),
    }),
  );

  if (productsError || !products) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al validar productos",
      },
    };
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Suma de cantidades pedidas dentro de este mismo carrito, agrupadas por
  // producto + fecha, para validar contra la disponibilidad de ese día
  // incluso si el carrito tuviera más de una línea para el mismo día.
  const requestedPerProductDate = new Map<string, number>();

  // Validate each item
  for (const item of items) {
    const product = productMap.get(item.product.id);

    if (!product) {
      return {
        data: null,
        error: {
          code: "PRODUCT_NOT_FOUND",
          message: `Producto ${item.product.name} no encontrado o no disponible`,
        },
      };
    }

    // Validate quantity
    if (item.quantity <= 0) {
      return {
        data: null,
        error: {
          code: "INVALID_QUANTITY",
          message: `Cantidad inválida para ${item.product.name}`,
        },
      };
    }

    // Validate price consistency (allow small floating point differences)
    const priceDiff = Math.abs(
      Number(product.price) - Number(item.product.price),
    );
    if (priceDiff > 0.01) {
      return {
        data: null,
        error: {
          code: "PRICE_MISMATCH",
          message: `El precio de ${item.product.name} ha cambiado`,
        },
      };
    }

    if (product.isReservable) {
      // Productos reservables: la fecha es obligatoria y el stock se valida
      // por día, no globalmente.
      if (!item.reservationDate || !DATE_REGEX.test(item.reservationDate)) {
        return {
          data: null,
          error: {
            code: "RESERVATION_DATE_REQUIRED",
            message: `Elige una fecha de reserva para ${item.product.name}`,
          },
        };
      }

      const key = `${product.id}__${item.reservationDate}`;
      requestedPerProductDate.set(
        key,
        (requestedPerProductDate.get(key) ?? 0) + item.quantity,
      );
    } else {
      // Validate stock (productos normales)
      if (product.stock < item.quantity) {
        return {
          data: null,
          error: {
            code: "INSUFFICIENT_STOCK",
            message: `Stock insuficiente para ${item.product.name}. Disponible: ${product.stock}`,
          },
        };
      }
    }
  }

  // Validate availability per date for reservable products
  for (const [key, requestedQuantity] of requestedPerProductDate.entries()) {
    const [productId, date] = key.split("__");
    const product = productMap.get(productId)!;

    const { data: bookedQuantity, error: bookedError } = await tryCatch(
      getBookedQuantityForDate(db, productId, date),
    );

    if (bookedError || bookedQuantity === null) {
      return {
        data: null,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Error al validar la disponibilidad de la reserva",
        },
      };
    }

    if (bookedQuantity + requestedQuantity > product.stock) {
      const remaining = Math.max(0, product.stock - bookedQuantity);
      return {
        data: null,
        error: {
          code: "DATE_NOT_AVAILABLE",
          message: `Solo quedan ${remaining} unidades de ${product.name} disponibles para el ${date}`,
        },
      };
    }
  }

  // Group items by seller to create separate transactions
  const itemsBySeller = new Map<string, CartItem[]>();
  for (const item of items) {
    const sellerId = productMap.get(item.product.id)!.sellerId;
    if (!itemsBySeller.has(sellerId)) {
      itemsBySeller.set(sellerId, []);
    }
    itemsBySeller.get(sellerId)!.push(item);
  }

  // Use database transaction to ensure atomicity for the entire purchase
  const { data: transactionResult, error: transactionError } = await tryCatch(
    db.transaction(async (tx) => {
      // 1. Calculate grand total for parent order
      let grandTotal = 0;
      for (const item of items) {
        const product = productMap.get(item.product.id)!;
        grandTotal += Number(product.price) * item.quantity;
      }

      // 2. Create parent order header
      const parentOrderId = crypto.randomUUID();
      const [newParentOrder] = await tx
        .insert(parentOrder)
        .values({
          id: parentOrderId,
          customerId: session.user.id,
          totalAmount: grandTotal.toString(),
          status: "completed",
          createdAt: new Date(),
        })
        .returning();

      if (!newParentOrder) {
        throw new Error("Failed to create parent order header");
      }

      const transactionIds: string[] = [];

      // 3. Create transactions for each seller
      for (const [sellerId, sellerItems] of itemsBySeller.entries()) {
        let sellerTotal = 0;
        for (const item of sellerItems) {
          const product = productMap.get(item.product.id)!;
          sellerTotal += Number(product.price) * item.quantity;
        }

        const transactionId = crypto.randomUUID();
        const [newTransaction] = await tx
          .insert(transactionHeader)
          .values({
            id: transactionId,
            parentOrderId: parentOrderId,
            sellerId: sellerId,
            customerId: session.user.id, // denormalized
            totalAmount: sellerTotal.toString(),
            status: "completed",
            createdAt: new Date(),
          })
          .returning();

        if (!newTransaction) {
          throw new Error("Failed to create seller transaction header");
        }

        transactionIds.push(transactionId);

        // 4. Create line items, and either update stock (productos normales)
        // o crear la reserva (productos reservables)
        for (const item of sellerItems) {
          const productData = productMap.get(item.product.id)!;
          const unitPrice = Number(productData.price);
          const quantity = item.quantity;
          const discount = 0;
          const taxes = 0;
          const lineItemTotal = unitPrice * quantity;

          // A. Insert generic transaction line (supertipo)
          const transactionLineId = crypto.randomUUID();
          await tx.insert(transactionLine).values({
            id: transactionLineId,
            transactionId: transactionId,
            type: productData.isReservable ? "booking" : "product",
            unitPrice: unitPrice.toString(),
            quantity: quantity,
            discount: discount.toString(),
            taxes: taxes.toString(),
            totalAmount: lineItemTotal.toString(),
            createdAt: new Date(),
          });

          if (productData.isReservable) {
            // B1. Insert booking line (subtipo) — el stock NO se descuenta
            // globalmente, ya se validó que hay cupo para esa fecha.
            const reservationDate = new Date(`${item.reservationDate}T00:00:00`);
            await tx.insert(bookingLine).values({
              transactionLineId: transactionLineId,
              productId: productData.id,
              userId: session.user.id,
              startDate: reservationDate,
              endDate: reservationDate,
            });
          } else {
            // B2. Insert product specific line (subtipo)
            await tx.insert(productLine).values({
              transactionLineId: transactionLineId,
              productId: productData.id,
            });

            // C. Update product stock
            await tx
              .update(productTable)
              .set({
                stock: productData.stock - quantity,
                updatedAt: new Date(),
              })
              .where(eq(productTable.id, productData.id));
          }
        }

        // 5. Create notification request for the seller
        try {
          await tx.insert(request).values({
            id: crypto.randomUUID(),
            userId: sellerId,
            type: "purchase_completed",
            message: `Nueva compra realizada por ${session.user.name || session.user.email}. Total: ${new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(sellerTotal)}`,
            read: false,
            referenceType: "product",
            createdAt: new Date(),
          });
        } catch (requestError) {
          console.error("Error creating notification:", requestError);
        }
      }

      return { transactionId: transactionIds[0] };
    }),
  );

  if (transactionError || !transactionResult) {
    console.error("Transaction error:", transactionError);
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message:
          transactionError instanceof Error
            ? transactionError.message
            : "Error al procesar la compra. Por favor, intenta de nuevo.",
      },
    };
  }

  return {
    data: { transactionId: transactionResult.transactionId },
    error: null,
  };
};
