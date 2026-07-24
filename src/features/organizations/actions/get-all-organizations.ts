"use server";

import { headers } from "next/headers";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { organization, member } from "@/shared/lib/drizzle/schema";
import { eq, sql, desc } from "drizzle-orm";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

import type { Organization } from "@/features/organizations/types";

interface PublicOrganization extends Organization {
  memberCount: number;
  isMember: boolean;
  userRole: string | null;
}

type ErrorCode = "UNAUTHORIZED" | "INTERNAL_SERVER_ERROR";

/**
 * Obtiene todas las organizaciones con información de membresía del usuario actual
 */
export const getAllOrganizations = async (): Promise<
  ActionResponse<PublicOrganization[], ErrorCode>
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

  const userId = session.user.id;

  // Obtener todas las organizaciones con el conteo de miembros
  const { data: orgs, error: orgsError } = await tryCatch(
    db
      .select({
        org: organization,
        memberCount: sql<number>`count(${member.id})::int`,
      })
      .from(organization)
      .leftJoin(member, eq(member.organizationId, organization.id))
      .groupBy(organization.id)
      .orderBy(desc(organization.createdAt)),
  );

  if (orgsError) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al obtener las organizaciones",
      },
    };
  }

  // Obtener las membresías del usuario actual
  const { data: userMemberships, error: memberError } = await tryCatch(
    db
      .select({
        organizationId: member.organizationId,
        role: member.role,
      })
      .from(member)
      .where(eq(member.userId, userId)),
  );

  if (memberError) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al obtener tus membresías",
      },
    };
  }

  // Crear un mapa de membresías para búsqueda rápida
  const membershipMap = new Map(
    (userMemberships ?? []).map((m) => [m.organizationId, m.role]),
  );

  // Combinar la información
  const result: PublicOrganization[] = (orgs ?? []).map((item) => ({
    ...item.org,
    memberCount: item.memberCount,
    isMember: membershipMap.has(item.org.id),
    userRole: membershipMap.get(item.org.id) ?? null,
  }));

  return {
    data: result,
    error: null,
  };
};
