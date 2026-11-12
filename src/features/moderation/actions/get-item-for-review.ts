"use server";

import { eq } from "drizzle-orm";

import { db } from "@/shared/lib/drizzle/server";
import {
  service,
  product,
  organization,
  user,
} from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import { getViewer } from "@/shared/lib/authz/server";
import {
  canDeleteItem,
  canModerateItem,
  canReviewItem,
} from "@/shared/lib/authz/access";
import type { ActionResponse } from "@/shared/types";

import { itemRefSchema, type ItemRef } from "@/features/moderation/types";
import { loadItemScope } from "@/features/moderation/lib/item-scope";

type ErrorCode =
  "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "INTERNAL_SERVER_ERROR";

export interface ItemDetail {
  id: string;
  name: string;
  description: string | null;
  price: number;
  priceUnit?: string;
  status: string;
  type: "product" | "service";
  serviceType?: string;
  location?: string | null;
  serviceConfig?: Record<string, unknown> | null;
  stock?: number | null;
  organizationId: string;
  organizationName: string;
  organizationSlug: string | null;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  rejectionReason?: string | null;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  /** El revisor actual puede aprobar/rechazar (no es su propio ítem). */
  canModerate: boolean;
  canDelete: boolean;
}

export const getItemForReview = async (
  input: ItemRef,
): Promise<ActionResponse<ItemDetail, ErrorCode>> => {
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

  const validation = itemRefSchema.safeParse(input);

  if (!validation.success) {
    return {
      data: null,
      error: { code: "NOT_FOUND", message: "Ítem no encontrado" },
    };
  }

  const { itemId, itemType } = validation.data;
  const scope = await loadItemScope(itemType, itemId);

  if (!scope || scope.deleted) {
    return {
      data: null,
      error: { code: "NOT_FOUND", message: "Ítem no encontrado" },
    };
  }

  // Revisan: el admin global y los administradores de la comuna del ítem
  if (!canReviewItem(viewer.access, scope)) {
    return {
      data: null,
      error: {
        code: "FORBIDDEN",
        message: "No tienes permiso para revisar ítems de esta comuna",
      },
    };
  }

  const permissions = {
    canModerate: canModerateItem(viewer.access, scope),
    canDelete: canDeleteItem(viewer.access, scope),
  };

  if (itemType === "service") {
    const { data: serviceData, error } = await tryCatch(
      db
        .select({
          id: service.id,
          name: service.name,
          description: service.description,
          price: service.price,
          priceUnit: service.priceUnit,
          status: service.status,
          serviceType: service.serviceType,
          location: service.location,
          serviceConfig: service.serviceConfig,
          organizationId: service.organizationId,
          organizationName: organization.name,
          organizationSlug: organization.slug,
          sellerId: service.sellerId,
          sellerName: user.name,
          sellerEmail: user.email,
          rejectionReason: service.rejectionReason,
          approvedBy: service.approvedBy,
          approvedAt: service.approvedAt,
          createdAt: service.createdAt,
          updatedAt: service.updatedAt,
        })
        .from(service)
        .innerJoin(organization, eq(service.organizationId, organization.id))
        .innerJoin(user, eq(service.sellerId, user.id))
        .where(eq(service.id, itemId))
        .limit(1),
    );

    if (error || !serviceData || serviceData.length === 0) {
      return {
        data: null,
        error: {
          code: "NOT_FOUND",
          message: "Servicio no encontrado",
        },
      };
    }

    const s = serviceData[0];
    return {
      data: {
        ...s,
        price: Number(s.price),
        type: "service",
        serviceConfig: s.serviceConfig as Record<string, unknown> | null,
        ...permissions,
      },
      error: null,
    };
  } else {
    const { data: productData, error } = await tryCatch(
      db
        .select({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          status: product.status,
          stock: product.stock,
          organizationId: product.organizationId,
          organizationName: organization.name,
          organizationSlug: organization.slug,
          sellerId: product.sellerId,
          sellerName: user.name,
          sellerEmail: user.email,
          rejectionReason: product.rejectionReason,
          approvedBy: product.approvedBy,
          approvedAt: product.approvedAt,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        })
        .from(product)
        .innerJoin(organization, eq(product.organizationId, organization.id))
        .innerJoin(user, eq(product.sellerId, user.id))
        .where(eq(product.id, itemId))
        .limit(1),
    );

    if (error || !productData || productData.length === 0) {
      return {
        data: null,
        error: {
          code: "NOT_FOUND",
          message: "Producto no encontrado",
        },
      };
    }

    const p = productData[0];
    return {
      data: {
        ...p,
        price: Number(p.price),
        type: "product",
        ...permissions,
      },
      error: null,
    };
  }
};
