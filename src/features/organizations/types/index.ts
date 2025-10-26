import { z } from "zod";

import { organization } from "@/shared/lib/drizzle/schema";

import { createOrganizationSchema } from "@/features/organizations/schemas/create-organization";
import { updateOrganizationSchema } from "@/features/organizations/schemas/update-organization";
import { deleteOrganizationSchema } from "@/features/organizations/schemas/delete-organization";
import { removeMemberSchema } from "@/features/organizations/schemas/remove-member";
import { sendOrganizationInvitationSchema } from "@/features/organizations/schemas/send-organization-invitation";
import { cancelInvitationSchema } from "@/features/organizations/schemas/cancel-invitation";

export type Organization = typeof organization.$inferSelect;

export type OrganizationMember = {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null | undefined;
  };
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  createdAt: Date;
};

export type ListMembers = {
  members: OrganizationMember[];
  total: number;
  limit: number | undefined;
  offset: number | undefined;
};

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
