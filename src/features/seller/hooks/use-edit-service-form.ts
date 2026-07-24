"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";

import { useSession } from "@/shared/hooks/use-session";

import { createServiceSchema } from "@/features/seller/schemas/create-service";
import { useUpdateServiceMutation } from "@/features/seller/hooks/use-update-service-mutation";
import type {
  CreateServiceVariables,
  ServiceType,
  PriceUnit,
  ServiceWithOrg,
} from "@/features/seller/types";
import { getRecommendedPriceUnit } from "@/features/seller/types";

interface Props {
  serviceId: string;
  service: ServiceWithOrg;
}

export const useEditServiceForm = ({ serviceId, service }: Props) => {
  const { data: session } = useSession();

  // Convertir el servicio a los valores del formulario
  const serviceConfig =
    (service.serviceConfig as Record<string, unknown>) ?? {};
  const availabilityRules =
    (service.availabilityRules as Record<string, unknown>) ?? {};

  const initialValues: CreateServiceVariables = {
    organizationId: service.organizationId,
    sellerId: service.sellerId || "",
    name: service.name,
    description: service.description || "",
    serviceType: (service.serviceType as ServiceType) || "other",
    price: service.price?.toString() || "",
    priceUnit: (service.priceUnit as PriceUnit) || "flat_rate",
    maxCapacity: service.maxCapacity || 1,
    durationMinutes: (serviceConfig.durationMinutes as number) || undefined,
    location: service.location || "",
    latitude:
      service.latitude !== null && service.latitude !== undefined
        ? Number(service.latitude)
        : undefined,
    longitude:
      service.longitude !== null && service.longitude !== undefined
        ? Number(service.longitude)
        : undefined,
    serviceConfig: serviceConfig,
    availabilityRules: availabilityRules,
    cancellationPolicy:
      (service.cancellationPolicy as
        | "flexible"
        | "moderate"
        | "strict"
        | "non_refundable") || "flexible",
    cancellationWindowHours: service.cancellationWindowHours ?? 24,
    images: [],
  };

  const form = useForm<CreateServiceVariables>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createServiceSchema) as any,
    defaultValues: initialValues,
  });

  const { mutate: updateService, isPending } = useUpdateServiceMutation({
    serviceId,
  });

  // Actualizar sellerId cuando la sesión cambie
  useEffect(() => {
    if (session?.user?.id && !form.getValues("sellerId")) {
      form.setValue("sellerId", session.user.id);
    }
  }, [session?.user?.id, form]);

  // Observar el tipo de servicio para mostrar campos específicos
  const serviceType = form.watch("serviceType");

  const onSubmit = (variables: CreateServiceVariables) => {
    updateService({ ...variables, serviceId });
  };

  // Helpers para configuración específica por tipo
  const updateServiceConfig = (config: Record<string, unknown>) => {
    const currentConfig = form.getValues("serviceConfig") || {};
    form.setValue("serviceConfig", { ...currentConfig, ...config });
  };

  const updateAvailabilityRules = (rules: Record<string, unknown>) => {
    const currentRules = form.getValues("availabilityRules") || {};
    form.setValue("availabilityRules", { ...currentRules, ...rules });
  };

  return {
    form,
    onSubmit,
    isPending,
    serviceType,
    updateServiceConfig,
    updateAvailabilityRules,
  };
};
