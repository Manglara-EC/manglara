"use server";

import { headers } from "next/headers";
import { and, desc, eq, isNotNull, or } from "drizzle-orm";
import { db } from "@/shared/lib/drizzle/server";
import { auth } from "@/shared/lib/better-auth/server";
import {
  product as productTable,
  service as serviceTable,
  user as userTable,
} from "@/shared/lib/drizzle/schema";
import {
  transactionHeader,
  transactionLine,
  bookingLine,
  productLine,
} from "@/shared/lib/drizzle/transactions";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

export type CustomerActivityKind =
  "service" | "product-reservation" | "product-purchase";

export interface CustomerActivity {
  id: string;
  transactionId: string;
  kind: CustomerActivityKind;
  itemId: string;
  itemName: string;
  itemImage?: string | null;
  serviceType?: string;
  location?: string | null;
  startDate?: Date;
  endDate?: Date;
  quantity: number;
  unitPrice: string;
  totalAmount: string;
  status: string;
  createdAt: Date;
  sellerName?: string | null;
  notes?: string | null;
}

type ErrorCode = "UNAUTHORIZED" | "INTERNAL_SERVER_ERROR";

export const getCustomerActivities = async (): Promise<
  ActionResponse<CustomerActivity[], ErrorCode>
> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Debes iniciar sesión para consultar tus actividades.",
      },
    };
  }

  const { data: rows, error } = await tryCatch(
    db
      .select({
        id: transactionLine.id,
        transactionId: transactionLine.transactionId,
        serviceId: bookingLine.serviceId,
        bookingProductId: bookingLine.productId,
        purchasedProductId: productLine.productId,
        startDate: bookingLine.startDate,
        endDate: bookingLine.endDate,
        notes: bookingLine.notes,
        quantity: transactionLine.quantity,
        unitPrice: transactionLine.unitPrice,
        totalAmount: transactionLine.totalAmount,
        createdAt: transactionLine.createdAt,
        status: transactionHeader.status,
        serviceName: serviceTable.name,
        serviceImages: serviceTable.images,
        serviceType: serviceTable.serviceType,
        serviceLocation: serviceTable.location,
        productName: productTable.name,
        productImages: productTable.images,
        productLocation: productTable.location,
        sellerName: userTable.name,
      })
      .from(transactionLine)
      .innerJoin(
        transactionHeader,
        eq(transactionLine.transactionId, transactionHeader.id),
      )
      .leftJoin(
        bookingLine,
        eq(bookingLine.transactionLineId, transactionLine.id),
      )
      .leftJoin(
        productLine,
        eq(productLine.transactionLineId, transactionLine.id),
      )
      .leftJoin(serviceTable, eq(bookingLine.serviceId, serviceTable.id))
      .leftJoin(
        productTable,
        or(
          eq(bookingLine.productId, productTable.id),
          eq(productLine.productId, productTable.id),
        ),
      )
      .leftJoin(userTable, eq(transactionHeader.sellerId, userTable.id))
      .where(
        and(
          eq(transactionHeader.customerId, session.user.id),
          or(
            isNotNull(bookingLine.transactionLineId),
            isNotNull(productLine.transactionLineId),
          ),
        ),
      )
      .orderBy(desc(transactionLine.createdAt)),
  );

  if (error || !rows) {
    console.error("Error fetching customer activities:", error);
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al obtener las actividades.",
      },
    };
  }

  const firstImage = (images: unknown): string | null =>
    Array.isArray(images) && typeof images[0] === "string" ? images[0] : null;

  const activities = rows.flatMap((row): CustomerActivity[] => {
    const base = {
      id: row.id,
      transactionId: row.transactionId,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      totalAmount: row.totalAmount,
      status: row.status,
      createdAt: new Date(row.createdAt),
      sellerName: row.sellerName,
    };

    // Cada fila representa una sola actividad. Las condiciones se evalúan
    // en este orden porque una reserva de servicio tiene prioridad sobre
    // cualquier otro dato relacionado que pueda traer la consulta.
    const serviceBooking =
      row.serviceId && row.serviceName && row.startDate && row.endDate
        ? {
            id: row.serviceId,
            name: row.serviceName,
            startDate: row.startDate,
            endDate: row.endDate,
          }
        : null;
    const productReservation =
      row.bookingProductId &&
      row.productName &&
      row.startDate &&
      row.endDate
        ? {
            id: row.bookingProductId,
            name: row.productName,
            startDate: row.startDate,
            endDate: row.endDate,
          }
        : null;
    const productPurchase =
      row.purchasedProductId && row.productName
        ? {
            id: row.purchasedProductId,
            name: row.productName,
          }
        : null;

    if (serviceBooking) {
      return [
        {
          ...base,
          kind: "service",
          itemId: serviceBooking.id,
          itemName: serviceBooking.name,
          itemImage: firstImage(row.serviceImages),
          serviceType: row.serviceType ?? "other",
          location: row.serviceLocation,
          startDate: new Date(serviceBooking.startDate),
          endDate: new Date(serviceBooking.endDate),
          notes: row.notes,
        },
      ];
    }

    if (productReservation) {
      return [
        {
          ...base,
          kind: "product-reservation",
          itemId: productReservation.id,
          itemName: productReservation.name,
          itemImage: firstImage(row.productImages),
          location: row.productLocation,
          startDate: new Date(productReservation.startDate),
          endDate: new Date(productReservation.endDate),
          notes: row.notes,
        },
      ];
    }

    if (productPurchase) {
      return [
        {
          ...base,
          kind: "product-purchase",
          itemId: productPurchase.id,
          itemName: productPurchase.name,
          itemImage: firstImage(row.productImages),
          location: row.productLocation,
        },
      ];
    }

    return [];
  });

  return {
    data: activities,
    error: null,
  };
};
