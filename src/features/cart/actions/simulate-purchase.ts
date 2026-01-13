"use server";

import { headers } from "next/headers";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/shared/lib/drizzle/server";
import { auth } from "@/shared/lib/better-auth/server";
import { product as productTable, transactionHeader, lineItem, request } from "@/shared/lib/drizzle/schema";
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
  items: CartItem[]
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
          eq(product.deleted, false)
        ),
    })
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
    const priceDiff = Math.abs(Number(product.price) - Number(item.product.price));
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

  const transactionIds: string[] = [];

  // Create transactions for each seller using database transactions
  for (const [sellerId, sellerItems] of itemsBySeller.entries()) {
    // Calculate total amount
    let totalAmount = 0;
    for (const item of sellerItems) {
      const product = productMap.get(item.product.id)!;
      totalAmount += Number(product.price) * item.quantity;
    }

    // Use database transaction to ensure atomicity
    const { data: transactionResult, error: transactionError } = await tryCatch(
      db.transaction(async (tx) => {
        // Create transaction header
        const transactionId = crypto.randomUUID();
        const [newTransaction] = await tx.insert(transactionHeader).values({
          id: transactionId,
          customerId: session.user.id,
          sellerId: sellerId,
          totalAmount: totalAmount.toString(),
          status: "completed",
          createdAt: new Date(),
        }).returning();

        if (!newTransaction) {
          throw new Error("Failed to create transaction header");
        }

        // Create line items and update stock
        for (const item of sellerItems) {
          const productData = productMap.get(item.product.id)!;
          const unitPrice = Number(productData.price);
          const quantity = item.quantity;
          const discount = 0; // No discount for now
          const taxes = 0; // No taxes for now
          const lineItemTotal = unitPrice * quantity;

          // Create line item
          await tx.insert(lineItem).values({
            id: crypto.randomUUID(),
            transactionId: transactionId,
            itemId: productData.id,
            unitPrice: unitPrice.toString(),
            quantity: quantity,
            discount: discount.toString(),
            taxes: taxes.toString(),
            totalAmount: lineItemTotal.toString(),
          });

          // Update product stock
          await tx
            .update(productTable)
            .set({
              stock: productData.stock - quantity,
              updatedAt: new Date(),
            })
            .where(eq(productTable.id, productData.id));
        }

        // Create notification request for the seller (non-critical, so we don't throw on error)
        try {
          await tx.insert(request).values({
            id: crypto.randomUUID(),
            userId: sellerId,
            type: "purchase_completed",
            message: `Nueva compra realizada por ${session.user.name || session.user.email}. Total: ${new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(totalAmount)}`,
            read: false,
            referenceType: "product",
            createdAt: new Date(),
          });
        } catch (requestError) {
          // Don't fail the transaction if notification fails
          console.error("Error creating notification:", requestError);
        }

        return { transactionId };
      })
    );

    if (transactionError || !transactionResult) {
      console.error("Transaction error:", transactionError);
      return {
        data: null,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: transactionError instanceof Error 
            ? transactionError.message 
            : "Error al procesar la compra. Por favor, intenta de nuevo.",
        },
      };
    }

    transactionIds.push(transactionResult.transactionId);
  }

  return {
    data: { transactionId: transactionIds[0] }, // Return first transaction ID
    error: null,
  };
};
