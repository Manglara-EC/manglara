"use server";

import { headers } from "next/headers";
import { eq, and, count } from "drizzle-orm";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { request } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

type ErrorCode = "UNAUTHORIZED" | "INTERNAL_SERVER_ERROR";

export const getUnreadCount = async (): Promise<
  ActionResponse<number, ErrorCode>
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

  const { data: result, error: countError } = await tryCatch(
    db
      .select({ count: count() })
      .from(request)
      .where(and(eq(request.userId, session.user.id), eq(request.read, false))),
  );

  if (countError) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch unread count",
      },
    };
  }

  return {
    data: result?.[0]?.count ?? 0,
    error: null,
  };
};
