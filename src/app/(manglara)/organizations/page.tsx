import { OrganizationsList } from "@/features/organizations/components/organizations-list";
import { getUserOrganizations } from "@/features/organizations/actions/get-user-organizations";

// Forzar renderizado dinámico (no cachear)
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OrganizationsPage() {
  const result = await getUserOrganizations();

  return (
    <OrganizationsList 
      initialData={result.data ?? []} 
      error={result.error?.message}
    />
  );
}
