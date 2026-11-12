"use server";

import { canAccessOrganizationArea } from "@/shared/lib/authz/access";
import { getAccess } from "@/shared/lib/authz/server";

export async function canAccessOrganizations(): Promise<boolean> {
  return canAccessOrganizationArea(await getAccess());
}
