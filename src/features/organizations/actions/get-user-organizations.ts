"use server";

import { headers } from "next/headers";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { organization, member } from "@/shared/lib/drizzle/schema";
import { eq } from "drizzle-orm";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

import type { Organization } from "@/features/organizations/types";

interface OrganizationWithRole extends Organization {
  userRole: string;
  membershipCreatedAt: string;
}

type ErrorCode = "UNAUTHORIZED" | "INTERNAL_SERVER_ERROR";

/**
 * Obtiene las organizaciones donde el usuario actual es miembro
 * Todos los usuarios ven solo las organizaciones donde son miembros
 */
export const getUserOrganizations = async (): Promise<
  ActionResponse<OrganizationWithRole[], ErrorCode>
> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Debes estar autenticado",
      },
    };
  }

  const { data, error } = await tryCatch(
    db
      .select({
        org: organization,
        memberRole: member.role,
        createdAt: member.createdAt,
      })
      .from(member)
      .innerJoin(organization, eq(member.organizationId, organization.id))
      .where(eq(member.userId, session.user.id))
  );

  if (error) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al obtener tus organizaciones",
      },
    };
  }

  const orgsWithRole: OrganizationWithRole[] = (data ?? []).map((item) => ({
    ...item.org,
    userRole: item.memberRole,
    membershipCreatedAt: item.createdAt.toISOString(),
  }));

  return {
    data: orgsWithRole,
    error: null,
  };
};
