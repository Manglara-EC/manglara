"use server";

import { eq, and, getTableColumns } from "drizzle-orm";

import { db } from "@/shared/lib/drizzle/server";
import { service, organization, user } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

import type { PublicService } from "@/features/services/types";

type ErrorCode = "NOT_FOUND" | "INTERNAL_SERVER_ERROR";

export const getServiceById = async (
  serviceId: string,
): Promise<ActionResponse<PublicService, ErrorCode>> => {
  const { data: serv, error: serviceError } = await tryCatch(
    db
      .select({
        ...getTableColumns(service),
        organizationName: organization.name,
        sellerName: user.name,
      })
      .from(service)
      .innerJoin(organization, eq(service.organizationId, organization.id))
      .innerJoin(user, eq(service.sellerId, user.id))
      .where(
        and(
          eq(service.id, serviceId),
          eq(service.status, "approved"),
          eq(service.deleted, false),
        ),
      )
      .limit(1),
  );

  if (serviceError || !serv || serv.length === 0) {
    return {
      data: null,
      error: {
        code: "NOT_FOUND",
        message: "Service not found",
      },
    };
  }

  return {
    data: serv[0],
    error: null,
  };
};
