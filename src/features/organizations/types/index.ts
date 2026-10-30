import { z } from "zod";

import { organization } from "@/shared/lib/drizzle/schema";

import { createOrganizationSchema } from "@/features/organizations/schemas/create-organization";
import { updateOrganizationSchema } from "@/features/organizations/schemas/update-organization";
import { deleteOrganizationSchema } from "@/features/organizations/schemas/delete-organization";
import { removeMemberSchema } from "@/features/organizations/schemas/remove-member";
import { sendOrganizationInvitationSchema } from "@/features/organizations/schemas/send-organization-invitation";
import { cancelInvitationSchema } from "@/features/organizations/schemas/cancel-invitation";

export type Organization = typeof organization.$inferSelect;

/** Miembro tal como lo ve el usuario actual (ver `VisibleOrganizationMember`). */
export type OrganizationMember = VisibleOrganizationMember;

export type ListMembers = OrganizationMembersResult;

/** Lo que el usuario actual puede hacer en la tabla de miembros. */
export interface MembersTableViewer {
  userId: string | null;
  viewerRole: OrganizationRole | null;
  isPlatformAdmin: boolean;
  canSeeEmails: boolean;
  canManageMembers: boolean;
}

export type CreateOrganizationVariables = z.infer<
  typeof createOrganizationSchema
>;

export type UpdateOrganizationVariables = z.infer<
  typeof updateOrganizationSchema
>;

export type DeleteOrganizationVariables = z.infer<
  typeof deleteOrganizationSchema
>;

export type RemoveMemberVariables = z.infer<typeof removeMemberSchema>;

export type SendOrganizationInvitationVariables = z.infer<
  typeof sendOrganizationInvitationSchema
>;

export type CancelInvitationVariables = z.infer<typeof cancelInvitationSchema>;

export type AcceptInvitationVariables = {
  invitationId: string;
};

export type RejectInvitationVariables = {
  invitationId: string;
};

import type { PublicItem } from "@/features/items/types";
import type {
  OrganizationPermission,
  OrganizationRole,
} from "@/shared/constants/roles";

export type OrganizationItem = PublicItem & {
  // Ventas completadas (solo productos)
  sales?: number;
  /** El usuario actual puede aprobar/rechazar este ítem. */
  canModerate?: boolean;
};

export interface OrganizationItemsResult {
  items: OrganizationItem[];
  /** `all`: todos los ítems de la comuna; `own`: solo los del vendedor. */
  scope: "all" | "own";
  /** El usuario actual modera ítems de esta comuna. */
  canModerate: boolean;
}

/** Miembro tal como lo ve el usuario actual (correo solo para administradores). */
export type VisibleOrganizationMember = {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
    email: string | null;
  };
};

export interface OrganizationMembersResult {
  members: VisibleOrganizationMember[];
  total: number;
}

/** Datos de la comuna y permisos del usuario actual sobre ella. */
export interface OrganizationOverview {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  createdAt: Date;
  memberCount: number;
  viewerRole: string | null;
  isMember: boolean;
  isPlatformAdmin: boolean;
  permissions: OrganizationPermission[];
}
