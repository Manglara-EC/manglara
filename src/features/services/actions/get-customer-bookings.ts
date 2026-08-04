"use server";

import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";
import { db } from "@/shared/lib/drizzle/server";
import { auth } from "@/shared/lib/better-auth/server";
import { service as serviceTable, user as userTable } from "@/shared/lib/drizzle/schema";
import {
  transactionHeader,
  transactionLine,
  bookingLine,
} from "@/shared/lib/drizzle/transactions";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

export interface CustomerBooking {
  id: string; // bookingLine / transactionLineId
  transactionId: string;
  serviceId: string;
  serviceName: string;
  serviceImage?: string | null;
  serviceType: string;
  location?: string | null;
  startDate: Date;
  endDate: Date;
  quantity: number;
  unitPrice: string;
  totalAmount: string;
  status: string;
  createdAt: Date;
  sellerName?: string | null;
  notes?: string | null;
}

type ErrorCode = "UNAUTHORIZED" | "INTERNAL_SERVER_ERROR";

export const getCustomerBookings = async (): Promise<
  ActionResponse<CustomerBooking[], ErrorCode>
> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Debes iniciar sesión para consultar tus reservas.",
      },
    };
  }

  const { data: rows, error } = await tryCatch(
    db
      .select({
        id: bookingLine.transactionLineId,
        transactionId: transactionLine.transactionId,
        serviceId: bookingLine.serviceId,
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
        location: serviceTable.location,
        sellerName: userTable.name,
      })
      .from(bookingLine)
      .innerJoin(
        transactionLine,
        eq(bookingLine.transactionLineId, transactionLine.id),
      )
      .innerJoin(
        transactionHeader,
        eq(transactionLine.transactionId, transactionHeader.id),
      )
      .innerJoin(serviceTable, eq(bookingLine.serviceId, serviceTable.id))
      .leftJoin(userTable, eq(serviceTable.sellerId, userTable.id))
      .where(eq(bookingLine.userId, session.user.id))
      .orderBy(desc(transactionLine.createdAt)),
  );

  if (error || !rows) {
    console.error("Error fetching customer bookings:", error);
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al obtener las reservas.",
      },
    };
  }

  const bookings: CustomerBooking[] = rows.map((row) => {
    let firstImg: string | null = null;
    if (Array.isArray(row.serviceImages) && row.serviceImages.length > 0) {
      firstImg = (row.serviceImages as string[])[0] || null;
    }

    return {
      id: row.id,
      transactionId: row.transactionId,
      serviceId: row.serviceId,
      serviceName: row.serviceName,
      serviceImage: firstImg,
      serviceType: row.serviceType,
      location: row.location,
      startDate: new Date(row.startDate),
      endDate: new Date(row.endDate),
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      totalAmount: row.totalAmount,
      status: row.status,
      createdAt: new Date(row.createdAt),
      sellerName: row.sellerName,
      notes: row.notes,
    };
  });

  return {
    data: bookings,
    error: null,
  };
};
