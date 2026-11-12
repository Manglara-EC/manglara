"use server";

import { and, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/shared/lib/drizzle/server";
import { member, organization, user } from "@/shared/lib/drizzle/schema";
import { tryCatch } from "@/shared/utils/try-catch";
import { getViewer } from "@/shared/lib/authz/server";
import {
  canInOrganization,
  getOrganizationRole,
  type Access,
} from "@/shared/lib/authz/access";
import {
  OrganizationRole,
  canAssignOrganizationRole,
  normalizeOrganizationRole,
} from "@/shared/constants/roles";
import type { ActionResponse } from "@/shared/types";

type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "INTERNAL_SERVER_ERROR";

type Result<T> = Promise<ActionResponse<T, ErrorCode>>;

const roleSchema = z.enum([
  OrganizationRole.OWNER,
  OrganizationRole.ADMIN,
  OrganizationRole.SELLER,
  OrganizationRole.MEMBER,
]);

const updateMemberRoleSchema = z.object({
  organizationId: z.string().min(1),
  memberId: z.string().min(1),
  role: roleSchema,
});

const removeMemberSchema = z.object({
  organizationId: z.string().min(1),
  memberId: z.string().min(1),
});

const addMemberSchema = z.object({
  organizationId: z.string().min(1),
  identifier: z
    .string()
    .trim()
    .min(3, { message: "Ingresa el correo o el usuario de la cuenta" }),
  role: roleSchema,
});

const fail = <T>(code: ErrorCode, message: string): Awaited<Result<T>> => ({
  data: null,
  error: { code, message },
});

/** ¿Puede el actor gestionar a un miembro que tiene `targetRole`? */
const canManageTarget = (
  access: Access,
  organizationId: string,
  targetRole: OrganizationRole,
) =>
  canAssignOrganizationRole(
    getOrganizationRole(access, organizationId),
    targetRole,
    access.isPlatformAdmin,
  );

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Aplica un cambio sobre un miembro dentro de una transacción que bloquea a los
 * owners de la comuna: dos degradaciones simultáneas nunca la dejan sin owner.
 */
const changeMemberKeepingOwner = (
  organizationId: string,
  memberId: string,
  { keepsOwnerRole }: { keepsOwnerRole: boolean },
  change: (tx: Transaction) => Promise<unknown>,
): Promise<"OK" | "LAST_OWNER"> =>
  db.transaction(async (tx) => {
    const owners = await tx
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.organizationId, organizationId),
          eq(member.role, OrganizationRole.OWNER),
        ),
      )
      .for("update");

    const targetIsOwner = owners.some((owner) => owner.id === memberId);
    const remainingOwners = owners.filter((owner) => owner.id !== memberId);

    if (targetIsOwner && !keepsOwnerRole && remainingOwners.length === 0) {
      return "LAST_OWNER";
    }

    await change(tx);
    return "OK";
  });

const findMember = async (organizationId: string, memberId: string) => {
  const [row] = await db
    .select({ id: member.id, role: member.role, userId: member.userId })
    .from(member)
    .where(
      and(eq(member.id, memberId), eq(member.organizationId, organizationId)),
    )
    .limit(1);

  return row ?? null;
};

/**
 * Cambia el rol de un miembro de la comuna.
 * - Owner: puede asignar cualquier rol y gestionar a cualquiera.
 * - Admin de comuna: solo asigna/gestiona `seller` y `member`.
 * - Admin global: cualquier comuna y rol.
 * La comuna nunca se queda sin owner.
 */
export const updateMemberRole = async (
  input: z.infer<typeof updateMemberRoleSchema>,
): Result<{ id: string; role: OrganizationRole }> => {
  const viewer = await getViewer();
  if (!viewer) return fail("UNAUTHORIZED", "Debes iniciar sesión");

  const validation = updateMemberRoleSchema.safeParse(input);
  if (!validation.success) return fail("VALIDATION_ERROR", "Datos inválidos");

  const { organizationId, memberId, role } = validation.data;

  if (
    !canInOrganization(viewer.access, organizationId, "member:update_role") ||
    !canAssignOrganizationRole(
      getOrganizationRole(viewer.access, organizationId),
      role,
      viewer.access.isPlatformAdmin,
    )
  ) {
    return fail("FORBIDDEN", "No tienes permiso para asignar ese rol");
  }

  const target = await findMember(organizationId, memberId);
  if (!target) return fail("NOT_FOUND", "Miembro no encontrado");

  const targetRole = normalizeOrganizationRole(target.role);

  if (!canManageTarget(viewer.access, organizationId, targetRole)) {
    return fail("FORBIDDEN", "No tienes permiso para gestionar a este miembro");
  }

  const { data: outcome, error } = await tryCatch(
    changeMemberKeepingOwner(
      organizationId,
      memberId,
      { keepsOwnerRole: role === OrganizationRole.OWNER },
      (tx) => tx.update(member).set({ role }).where(eq(member.id, memberId)),
    ),
  );

  if (error || !outcome) {
    return fail("INTERNAL_SERVER_ERROR", "No se pudo cambiar el rol");
  }

  if (outcome === "LAST_OWNER") {
    return fail(
      "CONFLICT",
      "La comuna debe tener al menos un administrador (owner)",
    );
  }

  revalidatePath("/organizations", "layout");

  return { data: { id: memberId, role }, error: null };
};

/** Quita a un miembro de la comuna (mismas reglas que cambiar el rol). */
export const removeOrganizationMember = async (
  input: z.infer<typeof removeMemberSchema>,
): Result<{ id: string }> => {
  const viewer = await getViewer();
  if (!viewer) return fail("UNAUTHORIZED", "Debes iniciar sesión");

  const validation = removeMemberSchema.safeParse(input);
  if (!validation.success) return fail("VALIDATION_ERROR", "Datos inválidos");

  const { organizationId, memberId } = validation.data;

  if (!canInOrganization(viewer.access, organizationId, "member:remove")) {
    return fail("FORBIDDEN", "No tienes permiso para quitar miembros");
  }

  const target = await findMember(organizationId, memberId);
  if (!target) return fail("NOT_FOUND", "Miembro no encontrado");

  const targetRole = normalizeOrganizationRole(target.role);

  if (!canManageTarget(viewer.access, organizationId, targetRole)) {
    return fail("FORBIDDEN", "No tienes permiso para quitar a este miembro");
  }

  const { data: outcome, error } = await tryCatch(
    changeMemberKeepingOwner(
      organizationId,
      memberId,
      { keepsOwnerRole: false },
      (tx) => tx.delete(member).where(eq(member.id, memberId)),
    ),
  );

  if (error || !outcome) {
    return fail("INTERNAL_SERVER_ERROR", "No se pudo quitar al miembro");
  }

  if (outcome === "LAST_OWNER") {
    return fail(
      "CONFLICT",
      "No puedes quitar al único administrador (owner) de la comuna",
    );
  }

  revalidatePath("/organizations", "layout");

  return { data: { id: memberId }, error: null };
};

/**
 * Agrega directamente una cuenta existente a una comuna con un rol.
 * Exclusivo del administrador global (p. ej. para designar al administrador
 * de una comuna). Los administradores de comuna usan invitaciones.
 */
export const addOrganizationMember = async (
  input: z.infer<typeof addMemberSchema>,
): Result<{ id: string }> => {
  const viewer = await getViewer();
  if (!viewer) return fail("UNAUTHORIZED", "Debes iniciar sesión");

  if (!viewer.access.isPlatformAdmin) {
    return fail(
      "FORBIDDEN",
      "Solo el administrador global puede agregar miembros directamente",
    );
  }

  const validation = addMemberSchema.safeParse(input);
  if (!validation.success) {
    return fail(
      "VALIDATION_ERROR",
      validation.error.issues[0]?.message ?? "Datos inválidos",
    );
  }

  const { organizationId, identifier, role } = validation.data;
  const normalized = identifier.replace(/^@/, "").toLowerCase();

  const [org] = await db
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1);

  if (!org) return fail("NOT_FOUND", "Comuna no encontrada");

  const [account] = await db
    .select({ id: user.id })
    .from(user)
    .where(or(eq(user.email, normalized), eq(user.username, normalized)))
    .limit(1);

  if (!account) {
    return fail("NOT_FOUND", "No existe una cuenta con ese correo o usuario");
  }

  const [existing] = await db
    .select({ id: member.id })
    .from(member)
    .where(
      and(
        eq(member.organizationId, organizationId),
        eq(member.userId, account.id),
      ),
    )
    .limit(1);

  if (existing) {
    return fail("CONFLICT", "Esa cuenta ya es miembro de la comuna");
  }

  const id = crypto.randomUUID();
  const { error } = await tryCatch(
    db.insert(member).values({
      id,
      organizationId,
      userId: account.id,
      role,
      createdAt: new Date(),
    }),
  );

  if (error)
    return fail("INTERNAL_SERVER_ERROR", "No se pudo agregar al miembro");

  revalidatePath("/organizations", "layout");

  return { data: { id }, error: null };
};
