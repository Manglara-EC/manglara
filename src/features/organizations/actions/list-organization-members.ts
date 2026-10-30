"use server";

import { asc, count, eq } from "drizzle-orm";

import { db } from "@/shared/lib/drizzle/server";
import { member, user } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import { getViewer } from "@/shared/lib/authz/server";
import { canInOrganization } from "@/shared/lib/authz/access";
import type { ActionResponse } from "@/shared/types";
import type { OrganizationMembersResult } from "@/features/organizations/types";

type ErrorCode = "UNAUTHORIZED" | "FORBIDDEN" | "INTERNAL_SERVER_ERROR";

interface Props {
  organizationId: string;
  limit?: number;
  offset?: number;
}

/**
 * Miembros de una comuna.
 * - Cualquier miembro ve nombres y roles.
 * - Solo los administradores de la comuna y el admin global ven los correos.
 */
export const listOrganizationMembers = async ({
  organizationId,
  limit = 10,
  offset = 0,
}: Props): Promise<ActionResponse<OrganizationMembersResult, ErrorCode>> => {
  const viewer = await getViewer();

  if (!viewer) {
    return {
      data: null,
      error: { code: "UNAUTHORIZED", message: "Debes iniciar sesión" },
    };
  }

  if (
    !canInOrganization(
      viewer.access,
      organizationId,
      "organization:view_members",
    )
  ) {
    return {
      data: null,
      error: {
        code: "FORBIDDEN",
        message: "Solo los miembros de la comuna pueden ver sus miembros",
      },
    };
  }

  const canSeeEmails = canInOrganization(
    viewer.access,
    organizationId,
    "organization:view_member_emails",
  );

  const safeLimit = Math.min(Math.max(Math.trunc(limit) || 0, 0), 100);
  const safeOffset = Math.max(Math.trunc(offset) || 0, 0);

  const { data, error } = await tryCatch(
    Promise.all([
      db
        .select({
          id: member.id,
          organizationId: member.organizationId,
          userId: member.userId,
          role: member.role,
          createdAt: member.createdAt,
          name: user.name,
          username: user.username,
          image: user.image,
          email: user.email,
        })
        .from(member)
        .innerJoin(user, eq(member.userId, user.id))
        .where(eq(member.organizationId, organizationId))
        .orderBy(asc(member.createdAt))
        .limit(safeLimit)
        .offset(safeOffset),
      db
        .select({ total: count() })
        .from(member)
        .where(eq(member.organizationId, organizationId)),
    ]),
  );

  if (error || !data) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al obtener los miembros",
      },
    };
  }

  const [rows, totalRows] = data;

  return {
    data: {
      members: rows.map((row) => ({
        id: row.id,
        organizationId: row.organizationId,
        userId: row.userId,
        role: row.role,
        createdAt: row.createdAt,
        user: {
          id: row.userId,
          name: row.name,
          username: row.username,
          image: row.image,
          email: canSeeEmails ? row.email : null,
        },
      })),
      total: totalRows[0]?.total ?? 0,
    },
    error: null,
  };
};
