"use server";

import { eq, and, desc, getTableColumns, sql, inArray } from "drizzle-orm";

import { db } from "@/shared/lib/drizzle/server";
import {
  product,
  service,
  organization,
  user,
} from "@/shared/lib/drizzle/schema";
import {
  transactionHeader,
  transactionLine,
  productLine,
} from "@/shared/lib/drizzle/transactions";
import { tryCatch } from "@/shared/utils/try-catch";
import { getViewer } from "@/shared/lib/authz/server";
import { canInOrganization, canModerateItem } from "@/shared/lib/authz/access";
import type { ActionResponse } from "@/shared/types";
import type {
  OrganizationItem,
  OrganizationItemsResult,
} from "@/features/organizations/types";

type ErrorCode = "UNAUTHORIZED" | "FORBIDDEN" | "INTERNAL_SERVER_ERROR";

/**
 * Ítems de una comuna para el panel de gestión.
 * - Admin global y administradores de la comuna: todos los ítems (cualquier
 *   estado) con acciones de moderación.
 * - Vendedores de la comuna: solo sus propios ítems, con estadísticas.
 * - Miembros sin rol de venta y no miembros: sin acceso (ven la tienda pública).
 */
export const getOrganizationItems = async (
  organizationId: string,
): Promise<ActionResponse<OrganizationItemsResult, ErrorCode>> => {
  const viewer = await getViewer();

  if (!viewer) {
    return {
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Debes iniciar sesión",
      },
    };
  }

  const { access } = viewer;
  const canViewAll = canInOrganization(access, organizationId, "item:view_all");
  const canSellHere = canInOrganization(access, organizationId, "item:create");

  if (!canViewAll && !canSellHere) {
    return {
      data: null,
      error: {
        code: "FORBIDDEN",
        message: "No tienes permiso para ver los items de esta organización",
      },
    };
  }

  const productConditions = [
    eq(product.organizationId, organizationId),
    eq(product.deleted, false),
  ];
  const serviceConditions = [
    eq(service.organizationId, organizationId),
    eq(service.deleted, false),
  ];

  if (!canViewAll) {
    productConditions.push(eq(product.sellerId, viewer.session.user.id));
    serviceConditions.push(eq(service.sellerId, viewer.session.user.id));
  }

  const { data: results, error } = await tryCatch(
    Promise.all([
      db
        .select({
          ...getTableColumns(product),
          organizationName: organization.name,
          sellerName: user.name,
        })
        .from(product)
        .innerJoin(organization, eq(product.organizationId, organization.id))
        .innerJoin(user, eq(product.sellerId, user.id))
        .where(and(...productConditions))
        .orderBy(desc(product.createdAt)),
      db
        .select({
          ...getTableColumns(service),
          organizationName: organization.name,
          sellerName: user.name,
        })
        .from(service)
        .innerJoin(organization, eq(service.organizationId, organization.id))
        .innerJoin(user, eq(service.sellerId, user.id))
        .where(and(...serviceConditions))
        .orderBy(desc(service.createdAt)),
    ]),
  );

  if (error || !results) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al obtener los ítems de la comuna",
      },
    };
  }

  const [products, services] = results;

  // Ventas completadas por producto
  const salesMap = new Map<string, number>();
  const productIds = products.map((p) => p.id);

  if (productIds.length > 0) {
    const { data: salesData } = await tryCatch(
      db
        .select({
          itemId: productLine.productId,
          totalSales:
            sql<number>`COALESCE(SUM(${transactionLine.quantity}), 0)`.as(
              "total_sales",
            ),
        })
        .from(productLine)
        .innerJoin(
          transactionLine,
          eq(productLine.transactionLineId, transactionLine.id),
        )
        .innerJoin(
          transactionHeader,
          eq(transactionLine.transactionId, transactionHeader.id),
        )
        .where(
          and(
            inArray(productLine.productId, productIds),
            eq(transactionHeader.status, "completed"),
          ),
        )
        .groupBy(productLine.productId),
    );

    salesData?.forEach((sale) =>
      salesMap.set(sale.itemId, Number(sale.totalSales)),
    );
  }

  const items: OrganizationItem[] = [
    ...products.map((p) => ({
      ...p,
      type: "product" as const,
      sales: salesMap.get(p.id) ?? 0,
      canModerate: canModerateItem(access, p),
    })),
    ...services.map((s) => ({
      ...s,
      type: "service" as const,
      canModerate: canModerateItem(access, s),
    })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return {
    data: {
      items,
      scope: canViewAll ? "all" : "own",
      canModerate: canInOrganization(access, organizationId, "item:moderate"),
    },
    error: null,
  };
};
