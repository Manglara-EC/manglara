"use server";

import { headers } from "next/headers";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { product, service, member, organization } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

import type { OrganizationData } from "@/features/organizations/types";
import { count, getTableColumns, and, eq, sql } from "drizzle-orm";

type ErrorCode = "UNAUTHORIZED" | "FORBIDDEN" | "INTERNAL_SERVER_ERROR";

export const getOrganizations = async (): Promise<
  ActionResponse<OrganizationData[], ErrorCode>
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

  const { data: organizationsWithCounts, error } = await tryCatch(
    db
      .select({
        // 1. Traemos todas las columnas normales de la organización
        ...getTableColumns(organization),
        
        // 2. Subconsulta para contar Miembros
        membersCount: sql<number>`(
            SELECT count(*) 
            FROM ${member} 
            WHERE ${member.organizationId} = ${organization.id}
        )`.mapWith(Number),

        // 3. Subconsulta para contar Productos (respetando tu filtro de deleted)
        productsCount: sql<number>`(
            SELECT count(*) 
            FROM ${product} 
            WHERE ${product.organizationId} = ${organization.id} 
            AND ${product.deleted} = false
        )`.mapWith(Number),

        // 4. Subconsulta para contar Servicios (respetando tu filtro de deleted)
        servicesCount: sql<number>`(
            SELECT count(*) 
            FROM ${service} 
            WHERE ${service.organizationId} = ${organization.id} 
            AND ${service.deleted} = false
        )`.mapWith(Number),
      })
      .from(organization)
  );

  if (error) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch organizations",
      },
    };
  }

  return {
    data: organizationsWithCounts ?? [] as OrganizationData[],
    error: null,
  };
};
