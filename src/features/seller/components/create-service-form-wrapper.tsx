"use client";

import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Label } from "@/shared/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

import { CreateServiceForm } from "@/features/seller/components/create-service-form";

interface Organization {
  id: string;
  name: string;
  slug: string | null;
  userRole: string;
}

interface Props {
  organizations: Organization[];
}

export function CreateServiceFormWrapper({ organizations }: Props) {
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>(
    organizations.length === 1 ? organizations[0].id : "",
  );

  if (!selectedOrganizationId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Selecciona una organización</CardTitle>
          <CardDescription>
            Elige la organización bajo la cual publicarás este servicio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organization">Organización</Label>
              <Select
                value={selectedOrganizationId}
                onValueChange={setSelectedOrganizationId}
              >
                <SelectTrigger id="organization">
                  <SelectValue placeholder="Selecciona una organización" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                      <span className="text-muted-foreground ml-2 text-xs">
                        ({org.userRole})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedOrg = organizations.find(
    (o) => o.id === selectedOrganizationId,
  );

  return (
    <div className="space-y-6">
      {/* Selector de organización si hay más de una */}
      {organizations.length > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  Publicando en: {selectedOrg?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Tu rol: {selectedOrg?.userRole}
                </p>
              </div>
              <Select
                value={selectedOrganizationId}
                onValueChange={setSelectedOrganizationId}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Cambiar organización" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulario de creación */}
      <CreateServiceForm organizationId={selectedOrganizationId} />
    </div>
  );
}
