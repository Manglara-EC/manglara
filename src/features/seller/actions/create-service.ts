// src/features/seller/actions/create-service.ts

"use server";

import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

import { auth } from "@/shared/lib/better-auth/server";
import { db } from "@/shared/lib/drizzle/server";
import { service, request, member } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import type { ActionResponse } from "@/shared/types";

import { createServiceSchema } from "@/features/seller/schemas/create-service";
import type { CreateServiceVariables } from "@/features/seller/types";
import type { Service } from "@/shared/types";
import { notifyOwnerOfNewItem } from "@/shared/actions/send-item-notification";

type ErrorCode = 
  | "UNAUTHORIZED" 
  | "FORBIDDEN" 
  | "VALIDATION_ERROR"
  | "INTERNAL_SERVER_ERROR";

export const createService = async (
  variables: CreateServiceVariables
): Promise<ActionResponse<Service, ErrorCode>> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Debes iniciar sesión",
      },
    };
  }

  const validation = createServiceSchema.safeParse(variables);

  if (!validation.success) {
    return {
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.error.message,
      },
    };
  }

  const { data: membership, error: membershipError } = await tryCatch(
    db.query.member.findFirst({
      where: and(
        eq(member.userId, session.user.id),
        eq(member.organizationId, variables.organizationId)
      ),
    })
  );

  if (membershipError || !membership) {
    return {
      data: null,
      error: {
        code: "FORBIDDEN",
        message: "No tienes permiso para publicar en esta organización",
      },
    };
  }

  if (membership.role !== "seller" && membership.role !== "owner") {
    return {
      data: null,
      error: {
        code: "FORBIDDEN",
        message: "Necesitas el rol de seller u owner",
      },
    };
  }

  const { data: newService, error: serviceError } = await tryCatch(
    db.insert(service).values({
      id: crypto.randomUUID(),
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...validation.data,
      sellerId: session.user.id
    }).returning()
  );

  if (serviceError || !newService || newService.length === 0) {
    return {
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al crear el servicio 😢",
      },
    };
  }

  await notifyOwnerOfNewItem({
    organizationId: variables.organizationId,
    itemName: newService[0].name,
    itemId: newService[0].id,
    type: "service", 
  });

  return {
    data: newService[0],
    error: null,
  };
};