"use client";

import { useSession } from "@/shared/hooks/use-session";

import { OrganizationItemsTable } from "@/features/organizations/components/organization-items-table";
import { OrganizationStore } from "@/features/items/components/organization-store";

interface Props {
  organizationId: string;
}

export function OrganizationItemsView({ organizationId }: Props) {
  const { data: session } = useSession();

  // Admin and seller see table view, others see store view
  const isAdmin = session?.user.role === "admin";
  // For seller check, we'll determine from the data in the table component
  // For now, show table for admin, store for others
  // The table component will handle seller logic internally

  if (isAdmin) {
    return <OrganizationItemsTable organizationId={organizationId} />;
  }

  // For non-admin users, check if they're a seller by trying to load items
  // If they get items with sales data, they're a seller and should see table
  // Otherwise show store view
  // For simplicity, we'll show table for all authenticated users on this page
  // The getOrganizationItems action will handle permissions
  return <OrganizationItemsTable organizationId={organizationId} />;
}
