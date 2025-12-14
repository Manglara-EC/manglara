import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { getServiceById } from "@/features/services/actions/get-service-by-id";
import { ServiceDetail } from "@/features/services/components/service-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { data: service } = await getServiceById(id);

  if (!service) {
    return {
      title: "Manglara | Servicio no encontrado",
    };
  }

  return {
    title: `Manglara | ${service.name}`,
    description: service.description ?? undefined,
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: service, error } = await getServiceById(id);

  if (error?.code === "NOT_FOUND" || !service) {
    return notFound();
  }

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["service", id],
    queryFn: () => service,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ServiceDetail service={service} />
    </HydrationBoundary>
  );
}
