"use server";

import { count, eq } from "drizzle-orm";

import { db } from "@/shared/lib/drizzle/server";
import { organization, member } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import { getViewer } from "@/shared/lib/authz/server";
import {
  getOrganizationPermissions,
  getOrganizationRole,
} from "@/shared/lib/authz/access";
import type { ActionResponse } from "@/shared/types";
import type { OrganizationOverview } from "@/features/organizations/types";

type ErrorCode = "UNAUTHORIZED" | "NOT_FOUND" | "INTERNAL_SERVER_ERROR";

/**
 * Información pública de una comuna y los permisos del usuario actual en ella.
 * Cualquier usuario autenticado puede verla; no incluye correos ni invitaciones.
 */
export const getOrganizationBySlug = async (
  slug: string,
): Promise<ActionResponse<OrganizationOverview, ErrorCode>> => {
  const viewer = await getViewer();

  if (!viewer) {
    return {
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Debes estar autenticado",
      },
    };
  }

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

  const { data: memberCount, error: countError } = await tryCatch(
    db
      .select({ total: count() })
      .from(member)
      .where(eq(member.organizationId, org.id)),
  );

  if (countError) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al obtener información de la organización",
      },
    };
  }

  const viewerRole = getOrganizationRole(viewer.access, org.id);

  return {
    data: {
      id: org.id,
      name: org.name,
      slug: org.slug ?? org.id,
      logo: org.logo,
      createdAt: org.createdAt,
      memberCount: memberCount?.[0]?.total ?? 0,
      viewerRole,
      isMember: viewerRole !== null,
      isPlatformAdmin: viewer.access.isPlatformAdmin,
      permissions: getOrganizationPermissions(viewer.access, org.id),
    },
    error: null,
  };
};
