import type { Product, Service } from "@/shared/types";
import type {
  ServiceConfig,
  AccommodationConfig,
  ActivityConfig,
  AvailabilityRules,
  TimeBasedConfig,
  DurationOption,
} from "@/shared/lib/drizzle/schema";

// Re-exportar tipos de configuración
export type {
  ServiceConfig,
  AccommodationConfig,
  ActivityConfig,
  AvailabilityRules,
  TimeBasedConfig,
  DurationOption,
};

// Tipos de servicio soportados
export const SERVICE_TYPES = ["accommodation", "activity"] as const;
export type ServiceType = typeof SERVICE_TYPES[number];

// Unidades de precio soportadas
export const PRICE_UNITS = ["night", "person", "day", "flat_rate"] as const;
export type PriceUnit = typeof PRICE_UNITS[number];

// Políticas de cancelación
export const CANCELLATION_POLICIES = ["flexible", "moderate", "strict", "non_refundable"] as const;
export type CancellationPolicy = typeof CANCELLATION_POLICIES[number];

// Labels para UI
export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  accommodation: "Alojamiento",
  activity: "Actividad o experiencia",
};

export const PRICE_UNIT_LABELS: Record<PriceUnit, string> = {
  night: "Por noche",
  person: "Por persona",
  day: "Por día",
  flat_rate: "Tarifa fija",
};

export const CANCELLATION_POLICY_LABELS: Record<CancellationPolicy, string> = {
  flexible: "Flexible (reembolso completo hasta 24h antes)",
  moderate: "Moderada (reembolso completo hasta 5 días antes)",
  strict: "Estricta (reembolso del 50% hasta 7 días antes)",
  non_refundable: "No reembolsable",
};

export interface CreateProductVariables {
  name: string;
  description?: string;
  price: string;
  stock: number;
  images?: string[];
  sellerId: string;
  organizationId: string;
} 

export interface CreateServiceVariables {
  // Campos básicos
  name: string;
  description?: string;
  serviceType: ServiceType;
  
  // Precio
  price: string;
  priceUnit: PriceUnit;
  
  // Configuración general
  durationMinutes?: number;
  maxCapacity?: number;
  location?: string;
  
  // Configuración específica por tipo (JSON)
  serviceConfig?: ServiceConfig | null;
  
  // Disponibilidad (JSON)
  availabilityRules?: AvailabilityRules | null;
  
  // Cancelación
  cancellationPolicy?: CancellationPolicy;
  cancellationWindowHours?: number;
  
  // Imágenes
  images?: string[];
  
  // Relaciones
  sellerId: string;
  organizationId: string;
}

export interface UpdateProductVariables {
  productId: string;
  name: string;
  description?: string;
  price: string;
  stock?: number;
  images?: string[];
  organizationId?: string;
}

export interface UpdateServiceVariables {
  serviceId: string;
  name: string;
  description?: string;
  serviceType?: ServiceType;
  price: string;
  priceUnit?: PriceUnit;
  durationMinutes?: number;
  maxCapacity?: number;
  location?: string;
  serviceConfig?: ServiceConfig | null;
  availabilityRules?: AvailabilityRules | null;
  cancellationPolicy?: CancellationPolicy;
  cancellationWindowHours?: number;
  images?: string[];
  organizationId?: string;
}

// Helper para obtener la unidad de precio recomendada por tipo de servicio
export const getRecommendedPriceUnit = (serviceType: ServiceType): PriceUnit => {
  switch (serviceType) {
    case "accommodation":
      return "night";
    case "activity":
      return "person";
    default:
      return "flat_rate";
  }
};

// Helper para obtener campos requeridos por tipo de servicio
export const getRequiredFieldsByType = (serviceType: ServiceType): string[] => {
  const common = ["name", "price", "organizationId"];
  
  switch (serviceType) {
    case "accommodation":
      return [...common, "maxCapacity", "location"];
    case "activity":
      return [...common, "maxCapacity"];
    default:
      return common;
  }
};

export interface ProductWithOrg extends Product {
  organizationName: string;
}

export interface ServiceWithOrg extends Service {
  organizationName: string;
}