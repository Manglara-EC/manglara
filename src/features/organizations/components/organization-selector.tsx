"use client";

import {
  Building2Icon,
  LoaderIcon,
  PackageIcon,
  UsersIcon,
  WrenchIcon,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";

import { useOrganizations } from "@/features/organizations/hooks/use-organizations";

interface OrganizationSelectorProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
}

export function OrganizationSelector({
  value,
  onValueChange,
}: OrganizationSelectorProps) {
  const { data: organizations, isLoading, isError } = useOrganizations();

  const handleValueChange = (newValue: string) => {
    // "all" means no filter (undefined)
    onValueChange(newValue === "all" ? undefined : newValue);
  };

  if (isLoading) {
    return <Skeleton className="h-9 w-64" />;
  }

  if (isError) {
    return null;
  }

  return (
    <Select value={value ?? "all"} onValueChange={handleValueChange}>
      <SelectTrigger className="w-full sm:w-80">
        <div className="flex items-center gap-2">
          <Building2Icon className="size-4 text-muted-foreground" />
          <SelectValue placeholder="Seleccionar organización" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          <span className="font-medium">Todas las organizaciones</span>
        </SelectItem>
        {organizations?.map((org) => {
          const orgWithCounts = org as typeof org & {
            membersCount?: number;
            productsCount?: number;
            servicesCount?: number;
          };
          const hasCounts =
            orgWithCounts.membersCount !== undefined ||
            orgWithCounts.productsCount !== undefined ||
            orgWithCounts.servicesCount !== undefined;

          return (
            <SelectItem key={org.id} value={org.id}>
              <div className="flex flex-col gap-1">
                <span className="font-medium">{org.name}</span>
                {hasCounts && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {orgWithCounts.membersCount !== undefined && (
                      <span className="flex items-center gap-1">
                        <UsersIcon className="size-3" />
                        {orgWithCounts.membersCount}
                      </span>
                    )}
                    {orgWithCounts.productsCount !== undefined && (
                      <span className="flex items-center gap-1">
                        <PackageIcon className="size-3" />
                        {orgWithCounts.productsCount}
                      </span>
                    )}
                    {orgWithCounts.servicesCount !== undefined && (
                      <span className="flex items-center gap-1">
                        <WrenchIcon className="size-3" />
                        {orgWithCounts.servicesCount}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
