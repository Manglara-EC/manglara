"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Building2Icon, ChevronRightIcon, UsersIcon } from "lucide-react";
import type { Organization } from "@/features/organizations/types";

interface PublicOrganization extends Organization {
  memberCount: number;
  isMember: boolean;
  userRole: string | null;
}

interface AllOrganizationsListProps {
  organizations: PublicOrganization[];
  error?: string;
}

const getRoleBadgeVariant = (role: string | null) => {
  switch (role) {
    case "owner":
      return "destructive";
    case "admin":
      return "default";
    case "member":
      return "secondary";
    default:
      return "outline";
  }
};

const getRoleLabel = (role: string | null) => {
  switch (role) {
    case "owner":
      return "Propietario";
    case "admin":
      return "Admin";
    case "member":
      return "Miembro";
    default:
      return null;
  }
};

export function AllOrganizationsList({ organizations, error }: AllOrganizationsListProps) {
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-sm text-red-800">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (organizations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-12 text-center">
          <Building2Icon className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">
            No hay organizaciones disponibles
          </p>
        </CardContent>
      </Card>
    );
  }

  // Separar organizaciones donde el usuario es miembro y las demás
  const myOrganizations = organizations.filter((org) => org.isMember);
  const otherOrganizations = organizations.filter((org) => !org.isMember);

  return (
    <div className="space-y-8">
      {/* Mis organizaciones */}
      {myOrganizations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Mis organizaciones</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {myOrganizations.map((org) => (
              <OrganizationCard key={org.id} org={org} />
            ))}
          </div>
        </div>
      )}

      {/* Otras organizaciones */}
      {otherOrganizations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">
            Otras organizaciones
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {otherOrganizations.map((org) => (
              <OrganizationCard key={org.id} org={org} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OrganizationCard({ org }: { org: PublicOrganization }) {
  const roleLabel = getRoleLabel(org.userRole);

  return (
    <Link href={`/organizations/${org.slug}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            {org.logo ? (
              <img
                src={org.logo}
                alt={org.name}
                className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                <Building2Icon className="h-6 w-6 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">{org.name}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {roleLabel && (
                  <Badge variant={getRoleBadgeVariant(org.userRole)}>
                    {roleLabel}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <UsersIcon className="h-3 w-3" />
                  {org.memberCount} {org.memberCount === 1 ? "miembro" : "miembros"}
                </span>
              </div>
            </div>
            <ChevronRightIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
