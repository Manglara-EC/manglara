"use server";

import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { service, request, member } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

import { approveServiceSchema } from "@/features/owner/schemas/approve-service";
import type { ApproveServiceVariables } from "@/features/owner/types";
import type { Service } from "@/shared/types";

type ErrorCode = 
  | "UNAUTHORIZED" 
  | "FORBIDDEN" 
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "INTERNAL_SERVER_ERROR";

export const approveService = async (
  variables: ApproveServiceVariables
): Promise<ActionResponse<Service, ErrorCode>> => {
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

  const validation = approveServiceSchema.safeParse(variables);
  
  if (!validation.success) {
    return {
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.error.message,
      },
    };
  }

  const { data: serv, error: servError } = await tryCatch(
    db.query.service.findFirst({
      where: eq(service.id, variables.serviceId),
    })
  );

  if (servError || !serv) {
    return {
      data: null,
      error: {
        code: "NOT_FOUND",
        message: "Service not found",
      },
    };
  }

  const { data: membership, error: membershipError } = await tryCatch(
    db.query.member.findFirst({
      where: and(
        eq(member.userId, session.user.id),
        eq(member.organizationId, serv.organizationId),
        eq(member.role, "owner")
      ),
    })
  );

  if (membershipError || !membership) {
    return {
      data: null,
      error: {
        code: "FORBIDDEN",
        message: "You don't have permission to approve this service",
      },
    };
  }

  const { data: updated, error: updateError } = await tryCatch(
    db
      .update(service)
      .set({
        status: "approved",
        approvedBy: session.user.id,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(service.id, variables.serviceId))
      .returning()
  );

  if (updateError || !updated || updated.length === 0) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to approve service",
      },
    };
  }

  await tryCatch(
    db
      .update(request)
      .set({ read: true })
      .where(
        and(
          eq(request.serviceId, variables.serviceId),
          eq(request.referenceType, "service"),
          eq(request.userId, session.user.id)
        )
      )
  );

  await tryCatch(
    db.insert(request).values({
      id: crypto.randomUUID(),
      userId: serv.sellerId,
      type: "service_approved",
      message: `Your service "${serv.name}" has been approved`,
      productId: null,
      serviceId: variables.serviceId,
      referenceType: "service",
      createdAt: new Date(),
    })
  );

  return {
    data: updated[0],
    error: null,
  };
};