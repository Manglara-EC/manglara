"use server";

import { headers } from "next/headers";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/shared/lib/drizzle/server";
import { auth } from "@/shared/lib/better-auth/server";
import { product as productTable, request } from "@/shared/lib/drizzle/schema";
import {
  parentOrder,
  transactionHeader,
  transactionLine,
  productLine,
} from "@/shared/lib/drizzle/transactions";
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
  | "INTERNAL_SERVER_ERROR";

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

    // Validate stock
    if (product.stock < item.quantity) {
      return {
        data: null,
        error: {
          code: "INSUFFICIENT_STOCK",
          message: `Stock insuficiente para ${item.product.name}. Disponible: ${product.stock}`,
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

        // 4. Create line items and update stock
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
            type: "product",
            unitPrice: unitPrice.toString(),
            quantity: quantity,
            discount: discount.toString(),
            taxes: taxes.toString(),
            totalAmount: lineItemTotal.toString(),
            createdAt: new Date(),
          });

          // B. Insert product specific line (subtipo)
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
