"use server";

import { headers } from "next/headers";
import { eq, and, count } from "drizzle-orm";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { product, service, member } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

import type { OrganizationStats } from "@/features/owner/types";

type ErrorCode = "UNAUTHORIZED" | "FORBIDDEN" | "INTERNAL_SERVER_ERROR";

export const getOrganizationStats = async (
  organizationId: string
): Promise<ActionResponse<OrganizationStats, ErrorCode>> => {
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

  // Verify user is owner
  const { data: membership, error: membershipError } = await tryCatch(
    db.query.member.findFirst({
      where: and(
        eq(member.userId, session.user.id),
        eq(member.organizationId, organizationId),
        eq(member.role, "owner")
      ),
    })
  );

  if (membershipError || !membership) {
    return {
      data: null,
      error: {
        code: "FORBIDDEN",
        message: "You don't have permission to view these stats",
      },
    };
  }

  // Count products by status
  const { data: productStats, error: productError } = await tryCatch(
    Promise.all([
      db
        .select({ count: count() })
        .from(product)
        .where(
          and(
            eq(product.organizationId, organizationId),
            eq(product.deleted, false)
          )
        ),
      db
        .select({ count: count() })
        .from(product)
        .where(
          and(
            eq(product.organizationId, organizationId),
            eq(product.status, "pending"),
            eq(product.deleted, false)
          )
        ),
      db
        .select({ count: count() })
        .from(product)
        .where(
          and(
            eq(product.organizationId, organizationId),
            eq(product.status, "approved"),
            eq(product.deleted, false)
          )
        ),
      db
        .select({ count: count() })
        .from(product)
        .where(
          and(
            eq(product.organizationId, organizationId),
            eq(product.status, "rejected"),
            eq(product.deleted, false)
          )
        ),
    ])
  );

  // Count services by status
  const { data: serviceStats, error: serviceError } = await tryCatch(
    Promise.all([
      db
        .select({ count: count() })
        .from(service)
        .where(
          and(
            eq(service.organizationId, organizationId),
            eq(service.deleted, false)
          )
        ),
      db
        .select({ count: count() })
        .from(service)
        .where(
          and(
            eq(service.organizationId, organizationId),
            eq(service.status, "pending"),
            eq(service.deleted, false)
          )
        ),
      db
        .select({ count: count() })
        .from(service)
        .where(
          and(
            eq(service.organizationId, organizationId),
            eq(service.status, "approved"),
            eq(service.deleted, false)
          )
        ),
      db
        .select({ count: count() })
        .from(service)
        .where(
          and(
            eq(service.organizationId, organizationId),
            eq(service.status, "rejected"),
            eq(service.deleted, false)
          )
        ),
    ])
  );

  if (productError || serviceError) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch stats",
      },
    };
  }

  return {
    data: {
      totalProducts: productStats?.[0]?.[0]?.count ?? 0,
      pendingProducts: productStats?.[1]?.[0]?.count ?? 0,
      approvedProducts: productStats?.[2]?.[0]?.count ?? 0,
      rejectedProducts: productStats?.[3]?.[0]?.count ?? 0,
      totalServices: serviceStats?.[0]?.[0]?.count ?? 0,
      pendingServices: serviceStats?.[1]?.[0]?.count ?? 0,
      approvedServices: serviceStats?.[2]?.[0]?.count ?? 0,
      rejectedServices: serviceStats?.[3]?.[0]?.count ?? 0,
    },
    error: null,
  };
};