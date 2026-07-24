"use server";

import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { request } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

import { markAsReadSchema } from "@/features/requests/schemas/mark-as-read";
import type { MarkAsReadVariables } from "@/features/requests/types";

type ErrorCode = "UNAUTHORIZED" | "VALIDATION_ERROR" | "INTERNAL_SERVER_ERROR";

export const markRequestAsRead = async (
  variables: MarkAsReadVariables,
): Promise<ActionResponse<boolean, ErrorCode>> => {
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

  const validation = markAsReadSchema.safeParse(variables);

  if (!validation.success) {
    return {
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.error.message,
      },
    };
  }

  const { error: updateError } = await tryCatch(
    db
      .update(request)
      .set({ read: true })
      .where(
        and(
          eq(request.id, variables.requestId),
          eq(request.userId, session.user.id),
        ),
      ),
  );

  if (updateError) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to mark request as read",
      },
    };
  }

  return {
    data: true,
    error: null,
  };
};
