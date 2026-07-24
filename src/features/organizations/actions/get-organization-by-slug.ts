"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { organization, member } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

interface PublicOrganizationInfo {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  createdAt: Date;
  memberCount: number;
  isMember: boolean;
  userRole: string | null;
}

type ErrorCode = "UNAUTHORIZED" | "NOT_FOUND" | "INTERNAL_SERVER_ERROR";

/**
 * Obtiene información pública de una organización por su slug
 * Cualquier usuario autenticado puede ver esta información
 */
export const getOrganizationBySlug = async (
  slug: string,
): Promise<ActionResponse<PublicOrganizationInfo, ErrorCode>> => {
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

  // Obtener la organización
  const { data: orgs, error: orgError } = await tryCatch(
    db.select().from(organization).where(eq(organization.slug, slug)).limit(1),
  );

  if (orgError || !orgs || orgs.length === 0) {
    return {
      data: null,
      error: {
        code: "NOT_FOUND",
        message: "Organización no encontrada",
      },
    };
  }

  const org = orgs[0];

  // Contar miembros
  const { data: members, error: membersError } = await tryCatch(
    db.select().from(member).where(eq(member.organizationId, org.id)),
  );

  if (membersError) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al obtener información de la organización",
      },
    };
  }

  // Verificar si el usuario es miembro
  const userMembership = members?.find((m) => m.userId === session.user.id);

  return {
    data: {
      id: org.id,
      name: org.name,
      slug: org.slug!,
      logo: org.logo,
      createdAt: org.createdAt,
      memberCount: members?.length ?? 0,
      isMember: !!userMembership,
      userRole: userMembership?.role ?? null,
    },
    error: null,
  };
};
