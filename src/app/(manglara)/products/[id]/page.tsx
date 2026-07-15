import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { getProductById } from "@/features/products/actions/get-product-by-id";
import { ProductDetail } from "@/features/products/components/product-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { data: product } = await getProductById(id);

  if (!product) {
    return {
      title: "Manglara | Producto no encontrado",
    };
  }

  return {
    title: `Manglara | ${product.name}`,
    description: product.description ?? undefined,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: product, error } = await getProductById(id);

  if (error?.code === "NOT_FOUND" || !product) {
    return notFound();
  }

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ["product", id],
    queryFn: () => product,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductDetail product={product} />
    </HydrationBoundary>
  );
}
