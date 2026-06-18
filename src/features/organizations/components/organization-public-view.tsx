"use client";

import { Building2Icon, UsersIcon, CalendarIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import {
  TypographyH1,
  TypographyMuted,
} from "@/shared/components/ui/typography";

interface PublicOrganizationInfo {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  createdAt: Date;
  memberCount: number;
  isMember: boolean;
  userRole: string | null;
}

interface Props {
  organization: PublicOrganizationInfo;
}

export function OrganizationPublicView({ organization }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        {organization.logo ? (
          <img
            src={organization.logo}
            alt={organization.name}
            className="h-16 w-16 rounded-xl object-cover"
          />
        ) : (
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <Building2Icon className="h-8 w-8 text-white" />
          </div>
        )}
        <div>
          <TypographyH1 className="text-2xl">{organization.name}</TypographyH1>
          <TypographyMuted>@{organization.slug}</TypographyMuted>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              Miembros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {organization.memberCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Creada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">
              {new Date(organization.createdAt).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* No member notice */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900">
              <Building2Icon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                No eres miembro de esta organización
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Contacta al administrador de la organización si deseas unirte.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
