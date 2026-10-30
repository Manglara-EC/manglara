import { CheckIcon, ClockIcon, PackageIcon, XIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

import { getOrganizationStats } from "@/features/moderation/actions/get-organization-stats";

interface Props {
  organizationId: string;
}

/** Resumen de moderación para administradores de la comuna (server component). */
export async function OrganizationStats({ organizationId }: Props) {
  const { data } = await getOrganizationStats(organizationId);

  if (!data) return null;

  const cards = [
    {
      label: "Pendientes de revisión",
      value: data.pendingProducts + data.pendingServices,
      icon: ClockIcon,
    },
    {
      label: "Aprobados",
      value: data.approvedProducts + data.approvedServices,
      icon: CheckIcon,
    },
    {
      label: "Rechazados",
      value: data.rejectedProducts + data.rejectedServices,
      icon: XIcon,
    },
    {
      label: "Total de ítems",
      value: data.totalProducts + data.totalServices,
      icon: PackageIcon,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, icon: Icon }) => (
        <Card key={label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
            <Icon className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
