"use server";

import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { service, request, member } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

import { rejectServiceSchema } from "@/features/owner/schemas/reject-service";
import type { RejectServiceVariables } from "@/features/owner/types";
import type { Service } from "@/shared/types";
import { markRequestAsReadByItem } from "@/shared/actions/mark-notification-as-read";

type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "INTERNAL_SERVER_ERROR";

export const rejectService = async (
  variables: RejectServiceVariables,
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

  const validation = rejectServiceSchema.safeParse(variables);

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
    }),
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
        eq(member.role, "owner"),
      ),
    }),
  );

  if (membershipError || !membership) {
    return {
      data: null,
      error: {
        code: "FORBIDDEN",
        message: "You don't have permission to reject this service",
      },
    };
  }

  const { data: updated, error: updateError } = await tryCatch(
    db
      .update(service)
      .set({
        status: "rejected",
        rejectionReason: variables.reason,
        updatedAt: new Date(),
      })
      .where(eq(service.id, variables.serviceId))
      .returning(),
  );

  if (updateError || !updated || updated.length === 0) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to reject service",
      },
    };
  }

  await markRequestAsReadByItem({
    userId: session.user.id,
    itemId: variables.serviceId,
    type: "service",
  });

  await tryCatch(
    db.insert(request).values({
      id: crypto.randomUUID(),
      userId: serv.sellerId,
      type: "service_rejected",
      message: `Your service "${serv.name}" has been rejected${variables.reason ? `: ${variables.reason}` : ""}`,
      productId: null,
      serviceId: variables.serviceId,
      referenceType: "service",
      createdAt: new Date(),
    }),
  );

  return {
    data: updated[0],
    error: null,
  };
};
