"use client";

import { useState } from "react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

import { ItemsGrid } from "@/features/items/components/items-grid";

interface CommuneOption {
  id: string;
  name: string;
}

export function ExploreCatalog({
  communes,
}: {
  communes: CommuneOption[] | null;
}) {
  const [organizationId, setOrganizationId] = useState<string>();

  return (
    <div className="flex flex-col gap-4">
      {communes && (
        <div className="flex flex-col gap-2 sm:max-w-xs">
          <label htmlFor="commune-filter" className="text-sm font-medium">
            Comuna
          </label>
          <Select
            value={organizationId ?? "all"}
            onValueChange={(value) =>
              setOrganizationId(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger id="commune-filter" className="w-full">
              <SelectValue placeholder="Todas las comunas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las comunas</SelectItem>
              {communes.map((commune) => (
                <SelectItem key={commune.id} value={commune.id}>
                  {commune.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="services">Servicios</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <ItemsGrid
            key={`all-${organizationId ?? "all"}`}
            params={{ organizationId }}
          />
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <ItemsGrid
            key={`products-${organizationId ?? "all"}`}
            params={{ organizationId, itemType: "product" }}
          />
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <ItemsGrid
            key={`services-${organizationId ?? "all"}`}
            params={{ organizationId, itemType: "service" }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
