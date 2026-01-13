// src/features/seller/actions/get-my-services.ts

"use server";

import { headers } from "next/headers";
import { eq, and, desc, getTableColumns } from "drizzle-orm";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { service, organization } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

import type { ServiceWithOrg } from "@/features/seller/types";

type ErrorCode = "UNAUTHORIZED" | "INTERNAL_SERVER_ERROR";

export const getMyServices = async (): Promise <
  ActionResponse<ServiceWithOrg[], ErrorCode>
> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Debes iniciar sesión",
      },
    };
  }

  const { data: services, error: servicesError } = await tryCatch(
    db
      .select({
        ...getTableColumns(service),
        organizationName: organization.name,
      })
      .from(service)
      .innerJoin(organization, eq(service.organizationId, organization.id))
      .where(
        and(
          eq(service.sellerId, session.user.id),
          eq(service.deleted, false)
        )
      )
      .orderBy(desc(service.createdAt))
  );

  if (servicesError) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al obtener servicios 😢",
      },
    };
  }

  return {
    data: services ?? [],
    error: null,
  };
};