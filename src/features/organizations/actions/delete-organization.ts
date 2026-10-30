"use server";

import { eq, inArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/shared/lib/drizzle/server";
import { organization, product, service } from "@/shared/lib/drizzle/schema";
import { bookingLine, productLine } from "@/shared/lib/drizzle/transactions";
import { tryCatch } from "@/shared/utils/try-catch";
import { getViewer } from "@/shared/lib/authz/server";
import { can } from "@/shared/lib/authz/access";
import type { ActionResponse } from "@/shared/types";

import { deleteOrganizationSchema } from "@/features/organizations/schemas/delete-organization";
import type { DeleteOrganizationVariables } from "@/features/organizations/types";

type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "HAS_TRANSACTIONS"
  | "INTERNAL_SERVER_ERROR";

/**
 * Elimina una comuna. Exclusivo del administrador global.
 *
 * Borra en cascada miembros, invitaciones, productos y servicios, por eso:
 * - se confirma escribiendo el nombre exacto de la comuna, y
 * - se bloquea si algún ítem tiene ventas o reservas registradas.
 */
export const deleteOrganization = async (
  variables: DeleteOrganizationVariables,
): Promise<ActionResponse<{ id: string }, ErrorCode>> => {
  const viewer = await getViewer();

  if (!viewer) {
    return {
      data: null,
      error: { code: "UNAUTHORIZED", message: "Debes iniciar sesión" },
    };
  }

  if (!can(viewer.access, "organization:delete")) {
    return {
      data: null,
      error: {
        code: "FORBIDDEN",
        message: "Solo el administrador global puede eliminar comunas",
      },
    };
  }

  const validation = deleteOrganizationSchema.safeParse(variables);

  if (!validation.success) {
    return {
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.error.issues[0]?.message ?? "Datos inválidos",
      },
    };
  }

  const { organizationId, confirmationName } = validation.data;

  const [org] = await db
    .select({ id: organization.id, name: organization.name })
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1);

  if (!org) {
    return {
      data: null,
      error: { code: "NOT_FOUND", message: "Comuna no encontrada" },
    };
  }

  if (confirmationName.trim() !== org.name.trim()) {
    return {
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: "El nombre no coincide con el de la comuna",
      },
    };
  }

  const productIds = (
    await db
      .select({ id: product.id })
      .from(product)
      .where(eq(product.organizationId, organizationId))
  ).map((p) => p.id);
  const serviceIds = (
    await db
      .select({ id: service.id })
      .from(service)
      .where(eq(service.organizationId, organizationId))
  ).map((s) => s.id);

  const hasSales =
    productIds.length > 0 &&
    (
      await db
        .select({ id: productLine.transactionLineId })
        .from(productLine)
        .where(inArray(productLine.productId, productIds))
        .limit(1)
    ).length > 0;

  const bookingConditions = [
    ...(productIds.length > 0
      ? [inArray(bookingLine.productId, productIds)]
      : []),
    ...(serviceIds.length > 0
      ? [inArray(bookingLine.serviceId, serviceIds)]
      : []),
  ];

  const hasBookings =
    bookingConditions.length > 0 &&
    (
      await db
        .select({ id: bookingLine.transactionLineId })
        .from(bookingLine)
        .where(or(...bookingConditions))
        .limit(1)
    ).length > 0;

  if (hasSales || hasBookings) {
    return {
      data: null,
      error: {
        code: "HAS_TRANSACTIONS",
        message:
          "La comuna tiene ventas o reservas registradas y no se puede eliminar. Puedes eliminar sus ítems para ocultarlos de la tienda.",
      },
    };
  }

  const { error } = await tryCatch(
    db.delete(organization).where(eq(organization.id, organizationId)),
  );

  if (error) {
    console.error("Error deleting organization:", error);
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "No se pudo eliminar la comuna",
      },
    };
  }

  revalidatePath("/organizations", "layout");

  return { data: { id: organizationId }, error: null };
};
