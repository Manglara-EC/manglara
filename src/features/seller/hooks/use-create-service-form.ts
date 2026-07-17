import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";

import { useSession } from "@/shared/hooks/use-session";

import { createServiceSchema } from "@/features/seller/schemas/create-service";
import { useCreateServiceMutation } from "@/features/seller/hooks/use-create-service-mutation";
import type {
  CreateServiceVariables,
  ServiceType,
  PriceUnit,
  ActivityConfig,
  AccommodationConfig,
  RentalConfig,
} from "@/features/seller/types";
import { getRecommendedPriceUnit } from "@/features/seller/types";

interface Props {
  organizationId: string;
}

const defaultValues: Partial<CreateServiceVariables> = {
  name: "",
  description: "",
  serviceType: "activity",
  price: "",
  priceUnit: "person",
  maxCapacity: 1,
  cancellationPolicy: "flexible",
  cancellationWindowHours: 24,
  images: [],
  serviceConfig: {},
  availabilityRules: {},
};

export const useCreateServiceForm = ({ organizationId }: Props) => {
  const { data: session } = useSession();

  const form = useForm<CreateServiceVariables>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createServiceSchema) as any,
    defaultValues: {
      ...defaultValues,
      organizationId,
      sellerId: session?.user?.id || "",
    },
  });

  const { mutate: createService, isPending } = useCreateServiceMutation();

  // Actualizar sellerId cuando la sesión cambie
  useEffect(() => {
    if (session?.user?.id) {
      form.setValue("sellerId", session.user.id);
    }
  }, [session?.user?.id, form]);

  // Actualizar unidad de precio y configuración cuando cambie el tipo de servicio
  const serviceType = form.watch("serviceType");
  const prevServiceTypeRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const recommendedUnit = getRecommendedPriceUnit(serviceType as ServiceType);
    form.setValue("priceUnit", recommendedUnit as PriceUnit);

    // Solo inicializar serviceConfig cuando cambie el tipo de servicio
    if (prevServiceTypeRef.current !== serviceType) {
      prevServiceTypeRef.current = serviceType;

      let defaultConfig:
        | ActivityConfig
        | AccommodationConfig
        | RentalConfig
        | Record<string, unknown> = {};

      switch (serviceType) {
        case "activity":
          defaultConfig = {
            difficulty: "easy",
            minParticipants: 1,
            meetingPoint: "",
            requirements: [],
            inclusions: [],
            exclusions: [],
          } as ActivityConfig;
          break;
        case "accommodation":
          defaultConfig = {
            checkInTime: "15:00",
            checkOutTime: "11:00",
            minNights: 1,
            maxNights: 30,
            bedrooms: 1,
            bathrooms: 1,
            beds: 1,
            amenities: [],
            houseRules: [],
          } as AccommodationConfig;
          break;
        case "rental":
          defaultConfig = {
            pricingMode: "hourly",
            hourlyPrice: "",
            dailyPrice: "",
          } as RentalConfig;
          break;
        default:
          defaultConfig = {};
      }

      form.setValue("serviceConfig", defaultConfig, { shouldDirty: true });
    }
  }, [serviceType, form]);

  const onSubmit = (variables: CreateServiceVariables) => {
    createService(variables);
  };

  // Helpers para configuración específica por tipo
  const updateServiceConfig = (config: Record<string, unknown>) => {
    const currentConfig = form.getValues("serviceConfig") ?? {};
    form.setValue(
      "serviceConfig",
      { ...currentConfig, ...config },
      { shouldDirty: true },
    );
  };

  const updateAvailabilityRules = (rules: Record<string, unknown>) => {
    const currentRules = form.getValues("availabilityRules") ?? {};
    form.setValue(
      "availabilityRules",
      { ...currentRules, ...rules },
      { shouldDirty: true },
    );
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
