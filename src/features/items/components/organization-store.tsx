"use client";

import { Store } from "lucide-react";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/shared/components/ui/tabs";
import { TypographyH3 } from "@/shared/components/ui/typography";

import { ItemsGrid } from "@/features/items/components/items-grid";

interface Props {
  organizationId: string;
}

export function OrganizationStore({ organizationId }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Store className="size-5" />
        <TypographyH3>Tienda</TypographyH3>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="services">Servicios</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <ItemsGrid params={{ organizationId }} />
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <ItemsGrid params={{ organizationId, itemType: "product" }} />
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <ItemsGrid params={{ organizationId, itemType: "service" }} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
