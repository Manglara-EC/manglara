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
  requiresCheckIn?: boolean;
  cancellationWindowHours?: number;
  availabilitySchedule?: Record<string, string[]>;
  images?: string[];
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
  requiresCheckIn?: boolean;
  cancellationWindowHours?: number;
  availabilitySchedule?: Record<string, string[]>;
  images?: string[];
}

export interface ProductWithOrg extends Product {
  organizationName: string;
}

export interface ServiceWithOrg extends Service {
  organizationName: string;
}