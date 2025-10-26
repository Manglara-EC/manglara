"use server";

import { headers } from "next/headers";
import { eq, or } from "drizzle-orm";

import { db } from "@/shared/lib/drizzle/server";
import { user } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse, User } from "@/shared/types";
import { auth } from "@/shared/lib/better-auth/server";

interface Props {
  id?: string;
  username?: string;
}

type ErrorCode =
  | "UNAUTHORIZED"
  | "USER_NOT_FOUND"
  | "MISSING_ID_OR_USERNAME"
  | "INTERNAL_SERVER_ERROR";

export const getUser = async ({
  id,
  username,
}: Props): Promise<ActionResponse<User, ErrorCode>> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "You must be logged in to get a user",
      },
    };
  }

  if (!id && !username)
    return {
      data: null,
      error: {
        code: "MISSING_ID_OR_USERNAME",
        message: "Either id or username is required",
      },
    };

  const { data, error } = await tryCatch(
    db
      .select()
      .from(user)
      .where(or(eq(user.id, id ?? ""), eq(user.username, username ?? "")))
      .limit(1),
  );

  if (error)
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong while fetching the user data 😢",
      },
    };

  if (!data || data.length === 0)
    return {
      data: null,
      error: {
        code: "USER_NOT_FOUND",
        message: "User not found",
      },
    };

  return {
    data: data[0],
    error: null,
  };
};
