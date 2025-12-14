import type { Metadata } from "next";

import {
  TypographyH1,
  TypographyMuted,
} from "@/shared/components/ui/typography";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";

import { ItemsGrid } from "@/features/items/components/items-grid";

export const metadata: Metadata = {
  title: "Manglara | Explore",
};

export default function ExplorePage() {
  return (
    <main className="flex flex-col gap-6">
      <div className="space-y-2">
        <TypographyH1>Explorar</TypographyH1>

        <TypographyMuted>Explora el mundo de Manglara. 🌴</TypographyMuted>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="services">Servicios</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <ItemsGrid />
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <ItemsGrid params={{ itemType: "product" }} />
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <ItemsGrid params={{ itemType: "service" }} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
