"use server";

import { headers } from "next/headers";
import { eq, desc, getTableColumns } from "drizzle-orm";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { request, product, service } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

import type { RequestWithReference } from "@/features/requests/types";

type ErrorCode = "UNAUTHORIZED" | "INTERNAL_SERVER_ERROR";

export const getMyRequests = async (): Promise <
  ActionResponse<RequestWithReference[], ErrorCode>
> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "You must be logged in",
      },
    };
  }

  const { data: requests, error: requestsError } = await tryCatch(
    db
      .select({
        ...getTableColumns(request),
        productName: product.name,
        serviceName: service.name,
      })
      .from(request)
      .leftJoin(product, eq(request.productId, product.id))
      .leftJoin(service, eq(request.serviceId, service.id))
      .where(eq(request.userId, session.user.id))
      .orderBy(desc(request.createdAt))
      .limit(50)
  );

  if (requestsError) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch requests",
      },
    };
  }

  return {
    data: (requests as RequestWithReference[]) ?? [],
    error: null,
  };
};