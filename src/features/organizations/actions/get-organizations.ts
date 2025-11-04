"use server";

import { headers } from "next/headers";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { organization } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

import type { Organization } from "@/features/organizations/types";

type ErrorCode = "UNAUTHORIZED" | "FORBIDDEN" | "INTERNAL_SERVER_ERROR";

export const getOrganizations = async (): Promise<
  ActionResponse<Organization[], ErrorCode>
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

  if (session.user.role !== "admin") {
    return {
      data: null,
      error: {
        code: "FORBIDDEN",
        message: "You are not authorized",
      },
    };
  }

  const { data, error } = await tryCatch(db.select().from(organization));

  if (error) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message:
          "Something went wrong while fetching the organizations data 😢",
      },
    };
  }

  return {
    data: data ?? [],
    error: null,
  };
};
