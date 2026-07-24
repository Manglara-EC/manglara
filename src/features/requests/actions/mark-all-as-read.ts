"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { request } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

type ErrorCode = "UNAUTHORIZED" | "INTERNAL_SERVER_ERROR";

export const markAllAsRead = async (): Promise<
  ActionResponse<boolean, ErrorCode>
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

  const { error: updateError } = await tryCatch(
    db
      .update(request)
      .set({ read: true })
      .where(eq(request.userId, session.user.id)),
  );

  if (updateError) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to mark all requests as read",
      },
    };
  }

  return {
    data: true,
    error: null,
  };
};
