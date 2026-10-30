"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import slugify from "slugify";

import { db } from "@/shared/lib/drizzle/server";
import { organization } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import { getViewer } from "@/shared/lib/authz/server";
import { canInOrganization } from "@/shared/lib/authz/access";
import type { ActionResponse } from "@/shared/types";

import { updateOrganizationSchema } from "@/features/organizations/schemas/update-organization";
import type { UpdateOrganizationVariables } from "@/features/organizations/types";

type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "SLUG_IS_TAKEN"
  | "INTERNAL_SERVER_ERROR";

/**
 * Actualiza nombre y slug de una comuna.
 * Administradores de la comuna (owner/admin) y el administrador global.
 */
export const updateOrganization = async ({
  organizationId,
  ...variables
}: UpdateOrganizationVariables & { organizationId: string }): Promise<
  ActionResponse<{ id: string; name: string; slug: string }, ErrorCode>
> => {
  const viewer = await getViewer();

  if (!viewer) {
    return {
      data: null,
      error: { code: "UNAUTHORIZED", message: "Debes iniciar sesión" },
    };
  }

  if (
    !canInOrganization(viewer.access, organizationId, "organization:update")
  ) {
    return {
      data: null,
      error: {
        code: "FORBIDDEN",
        message: "No tienes permiso para editar esta comuna",
      },
    };
  }

  const validation = updateOrganizationSchema.safeParse(variables);

  if (!validation.success) {
    return {
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.error.issues[0]?.message ?? "Datos inválidos",
      },
    };
  }

  const name = validation.data.name.trim();
  const slug = slugify(validation.data.slug, {
    lower: true,
    strict: true,
    trim: true,
  });

  if (!slug) {
    return {
      data: null,
      error: { code: "VALIDATION_ERROR", message: "El slug no es válido" },
    };
  }

  const [taken] = await db
    .select({ id: organization.id })
    .from(organization)
    .where(
      and(eq(organization.slug, slug), ne(organization.id, organizationId)),
    )
    .limit(1);

  if (taken) {
    return {
      data: null,
      error: { code: "SLUG_IS_TAKEN", message: "El slug ya está en uso" },
    };
  }

  const { data: updated, error } = await tryCatch(
    db
      .update(organization)
      .set({ name, slug })
      .where(eq(organization.id, organizationId))
      .returning({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      }),
  );

  if (error || !updated || updated.length === 0) {
    return {
      data: null,
      error: {
        code: error ? "INTERNAL_SERVER_ERROR" : "NOT_FOUND",
        message: "No se pudo actualizar la comuna",
      },
    };
  }

  revalidatePath("/organizations", "layout");

  return {
    data: { ...updated[0], slug: updated[0].slug ?? slug },
    error: null,
  };
};
