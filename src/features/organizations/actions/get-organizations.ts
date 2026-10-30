"use server";

import { getViewer } from "@/shared/lib/authz/server";
import { db } from "@/shared/lib/drizzle/server";
import { organization } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

import type { Organization } from "@/features/organizations/types";

type ErrorCode = "UNAUTHORIZED" | "FORBIDDEN" | "INTERNAL_SERVER_ERROR";

export const getOrganizations = async (): Promise<
  ActionResponse<Organization[], ErrorCode>
> => {
  const viewer = await getViewer();

  if (!viewer) {
    return {
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "You must be logged in",
      },
    };
  }

  if (!viewer.access.isPlatformAdmin) {
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
