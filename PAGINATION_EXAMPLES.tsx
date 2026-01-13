"use client";

/**
 * EJEMPLOS PRÁCTICOS DE PAGINACIÓN - Manglara
 * 
 * Este archivo contiene ejemplos listos para copiar/pegar
 * en tus componentes reales.
 */

// ============================================================================
// EJEMPLO 1: Página de Productos (Simple)
// ============================================================================

import { ItemsGrid } from "@/features/items/components/items-grid";

export function ProductsPageSimple() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Nuestros Productos</h1>
      
      {/* ItemsGrid maneja paginación automáticamente */}
      <ItemsGrid 
        params={{ itemType: "product" }}
        pageSize={50}
      />
    </div>
  );
}

// ============================================================================
// EJEMPLO 2: Página de Servicios con Búsqueda
// ============================================================================

"use client";

import { useState } from "react";
import { ItemsGrid } from "@/features/items/components/items-grid";
import { Input } from "@/shared/components/ui/input";

export function ServicesPageWithSearch() {
  const [query, setQuery] = useState("");

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Servicios</h1>

      {/* Barra de búsqueda */}
      <div className="mb-8">
        <Input
          placeholder="Buscar servicios..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Grid con paginación */}
      <ItemsGrid
        params={{
          itemType: "service",
          query: query || undefined,
        }}
        pageSize={50}
      />
    </div>
  );
}

// ============================================================================
// EJEMPLO 3: Explorar Todo (Productos + Servicios)
// ============================================================================

"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { ItemsGrid } from "@/features/items/components/items-grid";
import type { ItemType } from "@/shared/types";

export function ExplorePage() {
  const [itemType, setItemType] = useState<ItemType | undefined>(undefined);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Explorar Manglara</h1>

      <Tabs defaultValue="all" onValueChange={(value) => {
        const typeMap: Record<string, ItemType | undefined> = {
          all: undefined,
          products: "product",
          services: "service",
        };
        setItemType(typeMap[value]);
      }}>
        <TabsList>
          <TabsTrigger value="all">Todo</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="services">Servicios</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <ItemsGrid pageSize={50} />
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <ItemsGrid params={{ itemType: "product" }} pageSize={50} />
        </TabsContent>

        <TabsContent value="services" className="mt-6">
          <ItemsGrid params={{ itemType: "service" }} pageSize={50} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// EJEMPLO 4: Tienda de Organización (Con paginación)
// ============================================================================

"use client";

import { ItemsGrid } from "@/features/items/components/items-grid";

interface OrganizationStoreProps {
  organizationId: string;
  organizationName: string;
}

export function OrganizationStore({
  organizationId,
  organizationName,
}: OrganizationStoreProps) {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{organizationName}</h1>
        <p className="text-gray-600 mt-2">
          Explora todos los productos y servicios de esta tienda
        </p>
      </div>

      {/* Grid paginado para la organización */}
      <ItemsGrid
        params={{ organizationId }}
        pageSize={50}
      />
    </div>
  );
}

// ============================================================================
// EJEMPLO 5: Búsqueda Avanzada con Filtros
// ============================================================================

"use client";

import { useState } from "react";
import { ItemsGrid } from "@/features/items/components/items-grid";
import { Input } from "@/shared/components/ui/input";
import { Slider } from "@/shared/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type { ItemType } from "@/shared/types";

export function AdvancedSearch() {
  const [query, setQuery] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [itemType, setItemType] = useState<ItemType | undefined>(undefined);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Búsqueda Avanzada</h1>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 p-4 border rounded-lg">
        {/* Búsqueda por texto */}
        <div>
          <label className="text-sm font-medium">Buscar</label>
          <Input
            placeholder="Nombre del producto..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Rango de precio */}
        <div>
          <label className="text-sm font-medium">Precio mín: ${minPrice}</label>
          <Slider
            value={[minPrice]}
            onValueChange={(value) => setMinPrice(value[0])}
            max={10000}
            step={10}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Precio máx: ${maxPrice}</label>
          <Slider
            value={[maxPrice]}
            onValueChange={(value) => setMaxPrice(value[0])}
            max={10000}
            step={10}
          />
        </div>

        {/* Tipo de item */}
        <div>
          <label className="text-sm font-medium">Tipo</label>
          <Select
            value={itemType || "all"}
            onValueChange={(value) => {
              setItemType(value === "all" ? undefined : (value as ItemType));
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="product">Productos</SelectItem>
              <SelectItem value="service">Servicios</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid con filtros aplicados */}
      <ItemsGrid
        params={{
          query: query || undefined,
          minPrice: minPrice > 0 ? minPrice : undefined,
          maxPrice: maxPrice < 10000 ? maxPrice : undefined,
          itemType,
        }}
        pageSize={50}
      />
    </div>
  );
}

// ============================================================================
// EJEMPLO 6: Uso Manual del Hook usePaginatedItems
// ============================================================================

"use client";

import { usePaginatedItems } from "@/features/items/hooks/use-paginated-items";
import { Pagination } from "@/shared/components/pagination";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function ManualPaginationExample() {
  const {
    items,
    pagination,
    currentPage,
    setCurrentPage,
    isLoading,
    isError,
    error,
  } = usePaginatedItems({
    params: { itemType: "product" },
    initialPageSize: 50,
  });

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-700">Error: {error?.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contador de items */}
      {pagination && (
        <div className="text-sm text-gray-600">
          Mostrando {items.length} de {pagination.total} items
        </div>
      )}

      {/* Grid de items */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-video" />
              <Skeleton className="h-4" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))
        ) : (
          items.map((item) => (
            <div key={`${item.type}-${item.id}`} className="border rounded-lg p-4">
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-sm text-gray-600">${item.price}</p>
            </div>
          ))
        )}
      </div>

      {/* Paginación */}
      {pagination && (
        <Pagination
          pagination={pagination}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

// ============================================================================
// EJEMPLO 7: Con Scroll al Inicio
// ============================================================================

"use client";

import { useEffect, useRef } from "react";
import { ItemsGrid } from "@/features/items/components/items-grid";
import { usePaginatedItems } from "@/features/items/hooks/use-paginated-items";
import { Pagination } from "@/shared/components/pagination";

export function GridWithScrollTop() {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    items,
    pagination,
    currentPage,
    setCurrentPage,
  } = usePaginatedItems({
    params: { itemType: "product" },
  });

  // Scroll al inicio cuando cambia página
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [currentPage]);

  return (
    <div ref={containerRef} className="scroll-mt-4">
      <ItemsGrid
        params={{ itemType: "product" }}
        pageSize={50}
      />
    </div>
  );
}

// ============================================================================
// EJEMPLO 8: Página Individual de Producto (Sin paginación)
// ============================================================================

"use client";

import { useQuery } from "@tanstack/react-query";
import { getProductById } from "@/features/products/actions/get-product-by-id";

interface ProductPageProps {
  productId: string;
}

export function ProductPage({ productId }: ProductPageProps) {
  // Este componente NO usa paginación, ejemplo de referencia
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const { data } = await getProductById(productId);
      return data;
    },
  });

  if (isLoading) return <div>Cargando...</div>;
  if (!product) return <div>Producto no encontrado</div>;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold">{product.name}</h1>
      <p className="text-2xl font-semibold text-green-600">${product.price}</p>
      <p className="text-gray-700 mt-4">{product.description}</p>
    </div>
  );
}

// ============================================================================
// EJEMPLO 9: Recomendaciones (Similar Items)
// ============================================================================

"use client";

import { ItemsGrid } from "@/features/items/components/items-grid";

interface SimilarItemsProps {
  organizationId: string;
  currentItemId: string;
}

export function SimilarItems({ organizationId, currentItemId }: SimilarItemsProps) {
  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Más de esta tienda</h2>

      {/* Mostrar solo 4 items sin paginación */}
      <ItemsGrid
        params={{ organizationId }}
        pageSize={4}
      />
    </div>
  );
}

// ============================================================================
// EJEMPLO 10: Carrito (Con items paginados)
// ============================================================================

"use client";

import { ItemsGrid } from "@/features/items/components/items-grid";

export function CartSuggestions() {
  return (
    <div className="mt-8 pt-8 border-t">
      <h2 className="text-2xl font-bold mb-6">Tal vez te interese...</h2>

      {/* Sugerencias paginadas basadas en carrito */}
      <ItemsGrid
        params={{ itemType: "product" }}
        pageSize={50}
      />
    </div>
  );
}

// ============================================================================
// EXPORT de ejemplos
// ============================================================================

export default function PaginationExamplesPage() {
  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold mb-8">Ejemplos de Paginación</h1>
      
      <div className="grid gap-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">1. Productos Simple</h2>
          <ProductsPageSimple />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">2. Servicios con Búsqueda</h2>
          <ServicesPageWithSearch />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">3. Explorar Todo</h2>
          <ExplorePage />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">4. Búsqueda Avanzada</h2>
          <AdvancedSearch />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">5. Paginación Manual</h2>
          <ManualPaginationExample />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">6. Con Scroll al Inicio</h2>
          <GridWithScrollTop />
        </section>
      </div>
    </div>
  );
}
