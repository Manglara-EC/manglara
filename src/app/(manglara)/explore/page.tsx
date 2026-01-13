"use client";

import { useState } from "react";

import {
  TypographyH1,
  TypographyMuted,
} from "@/shared/components/ui/typography";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";

import { ItemsGrid } from "@/features/items/components/items-grid";
import { OrganizationSelector } from "@/features/organizations/components/organization-selector";

export default function ExplorePage() {
  const [selectedOrganization, setSelectedOrganization] = useState<string | undefined>();

  return (
    <main className="flex flex-col gap-6">
      <div className="space-y-2">
        <TypographyH1>Explorar</TypographyH1>

        <TypographyMuted>Explora el mundo de Manglara. 🌴</TypographyMuted>
      </div>

      <OrganizationSelector
        value={selectedOrganization}
        onValueChange={setSelectedOrganization}
      />

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="services">Servicios</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <ItemsGrid params={{ organizationId: selectedOrganization }} />
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <ItemsGrid params={{ itemType: "product", organizationId: selectedOrganization }} />
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <ItemsGrid params={{ itemType: "service", organizationId: selectedOrganization }} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
