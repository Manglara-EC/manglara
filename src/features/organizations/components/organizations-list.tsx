"use client";

import Link from "next/link";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Building2Icon, ChevronRightIcon } from "lucide-react";
import type { Organization } from "@/features/organizations/types";

interface OrganizationWithRole extends Organization {
  userRole: string;
  membershipCreatedAt: string;
}

interface OrganizationsListProps {
  initialData: OrganizationWithRole[];
  error?: string;
}

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case "owner":
      return "bg-red-100 text-red-800";
    case "admin":
      return "bg-blue-100 text-blue-800";
    case "member":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case "owner":
      return "Propietario";
    case "admin":
      return "Admin";
    case "member":
      return "Miembro";
    default:
      return role;
  }
};

export function OrganizationsList({ initialData, error }: OrganizationsListProps) {
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-sm text-red-800">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (initialData.length === 0) {
    return (
      <Card>
        <CardContent className="pt-12 text-center">
          <Building2Icon className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">
            Aún no perteneces a ninguna organización
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Crea una nueva organización o espera a ser invitado a una existente
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {initialData.map((org) => (
        <Link key={org.id} href={`/organizations/${org.slug}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {org.logo ? (
                    <img
                      src={org.logo}
                      alt={org.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <Building2Icon className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-base">{org.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getRoleBadgeColor(
                          org.userRole
                        )}`}
                      >
                        {getRoleLabel(org.userRole)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Desde{" "}
                        {new Date(org.membershipCreatedAt).toLocaleDateString(
                          "es-ES"
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
