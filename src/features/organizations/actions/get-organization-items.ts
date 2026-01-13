"use server";

import { headers } from "next/headers";
import { eq, and, desc, getTableColumns, sql, inArray, sum } from "drizzle-orm";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { product, service, organization, user, member, lineItem, transactionHeader } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

import type { PublicItem } from "@/features/items/types";

type ErrorCode = "UNAUTHORIZED" | "FORBIDDEN" | "INTERNAL_SERVER_ERROR";

interface OrganizationItem extends PublicItem {
  // For seller view: statistics
  sales?: number;
  views?: number; // Placeholder for future implementation
}

export const getOrganizationItems = async (
  organizationId: string
): Promise<ActionResponse<OrganizationItem[], ErrorCode>> => {
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

  // Check user role in organization
  const { data: membership, error: membershipError } = await tryCatch(
    db.query.member.findFirst({
      where: and(
        eq(member.userId, session.user.id),
        eq(member.organizationId, organizationId)
      ),
    })
  );

  // Check if user is admin (global admin role)
  const isSystemAdmin = session.user.role === "admin";
  const isSystemSeller = session.user.role === "seller";
  
  // Organization roles: owner, admin, member
  const isOrgOwner = membership?.role === "owner";
  const isOrgAdmin = membership?.role === "admin";
  const isOrgMember = membership?.role === "member";
  const isMemberOfOrg = !!membership;
  
  // Permissions:
  // - System admins: See all items
  // - Org owners/admins: See all items of the organization
  // - Org members who are system sellers: See only their own items
  // - Org members who are regular users: Cannot see items (no permission)
  const canSeeAllOrgItems = isSystemAdmin || isOrgOwner || isOrgAdmin;
  const canSeeOwnItems = isMemberOfOrg && isSystemSeller;

  if (!canSeeAllOrgItems && !canSeeOwnItems) {
    return {
      data: null,
      error: {
        code: "FORBIDDEN",
        message: "No tienes permiso para ver los items de esta organización",
      },
    };
  }

  const items: OrganizationItem[] = [];

  if (canSeeAllOrgItems) {
    // Admin/Owner/OrgAdmin: Get all products and services of the organization
    const { data: products, error: productsError } = await tryCatch(
      db
        .select({
          ...getTableColumns(product),
          organizationName: organization.name,
          sellerName: user.name,
        })
        .from(product)
        .innerJoin(organization, eq(product.organizationId, organization.id))
        .innerJoin(user, eq(product.sellerId, user.id))
        .where(
          and(
            eq(product.organizationId, organizationId),
            eq(product.deleted, false)
          )
        )
        .orderBy(desc(product.createdAt))
    );

    if (productsError) {
      return {
        data: null,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Error al obtener productos",
        },
      };
    }

    if (products) {
      items.push(
        ...products.map((p) => ({
          ...p,
          type: "product" as const,
        }))
      );
    }

    const { data: services, error: servicesError } = await tryCatch(
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
            eq(service.organizationId, organizationId),
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
          message: "Error al obtener servicios",
        },
      };
    }

    if (services) {
      items.push(
        ...services.map((s) => ({
          ...s,
          type: "service" as const,
        }))
      );
    }
  } else if (canSeeOwnItems) {
    // System seller member: Get only their products with statistics
    const { data: products, error: productsError } = await tryCatch(
      db
        .select({
          ...getTableColumns(product),
          organizationName: organization.name,
          sellerName: user.name,
        })
        .from(product)
        .innerJoin(organization, eq(product.organizationId, organization.id))
        .innerJoin(user, eq(product.sellerId, user.id))
        .where(
          and(
            eq(product.organizationId, organizationId),
            eq(product.sellerId, session.user.id),
            eq(product.deleted, false)
          )
        )
        .orderBy(desc(product.createdAt))
    );

    if (productsError) {
      return {
        data: null,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Error al obtener productos",
        },
      };
    }

    if (products) {
      // Get sales statistics for each product
      const productIds = products.map((p) => p.id);
      
      if (productIds.length > 0) {
        const { data: salesData, error: salesError } = await tryCatch(
          db
            .select({
              itemId: lineItem.itemId,
              totalSales: sql<number>`COALESCE(SUM(${lineItem.quantity}), 0)`.as('total_sales'),
            })
            .from(lineItem)
            .innerJoin(transactionHeader, eq(lineItem.transactionId, transactionHeader.id))
            .where(
              and(
                inArray(lineItem.itemId, productIds),
                eq(transactionHeader.status, "completed")
              )
            )
            .groupBy(lineItem.itemId)
        );

        const salesMap = new Map<string, number>();
        if (salesData && !salesError) {
          salesData.forEach((sale) => {
            salesMap.set(sale.itemId, Number(sale.totalSales));
          });
        }

        items.push(
          ...products.map((p) => ({
            ...p,
            type: "product" as const,
            sales: salesMap.get(p.id) ?? 0,
            views: 0, // Placeholder for future implementation
          }))
        );
      } else {
        items.push(
          ...products.map((p) => ({
            ...p,
            type: "product" as const,
            sales: 0,
            views: 0,
          }))
        );
      }
    }
  }

  // Sort by createdAt
  items.sort((a, b) => {
    const aDate = new Date(a.createdAt).getTime();
    const bDate = new Date(b.createdAt).getTime();
    return bDate - aDate;
  });

  return {
    data: items,
    error: null,
  };
};
