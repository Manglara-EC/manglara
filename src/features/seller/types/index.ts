import type { Product, Service } from "@/shared/types";

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
  name: string;
  description?: string;
  price: string;
  priceUnit?: 'hour' | 'day' | 'person' | 'flat_rate';
  durationMinutes?: number;
  maxCapacity?: number;
  cancellationWindowHours?: number;
  images?: string[];
  serviceType?: string;
  serviceConfig?: Record<string, any>;
  availabilityRules?: Record<string, any>;
  cancellationPolicy?: string;
  location?: string;
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
}

export interface UpdateServiceVariables {
  serviceId: string;
  name: string;
  description?: string;
  price: string;
  priceUnit?: 'hour' | 'day' | 'person' | 'flat_rate';
  durationMinutes?: number;
  maxCapacity?: number;
  cancellationWindowHours?: number;
  images?: string[];
  serviceType?: string;
  serviceConfig?: Record<string, any>;
  availabilityRules?: Record<string, any>;
  cancellationPolicy?: string;
  location?: string;
}

export interface ProductWithOrg extends Product {
  organizationName: string;
}

export interface ServiceWithOrg extends Service {
  organizationName: string;
}