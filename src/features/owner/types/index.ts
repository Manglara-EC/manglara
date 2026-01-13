import type { Product, Service } from "@/shared/types";

export interface ApproveProductVariables {
  productId: string;
}

export interface RejectProductVariables {
  productId: string;
  reason?: string;
}

export interface ApproveServiceVariables {
  serviceId: string;
}

export interface RejectServiceVariables {
  serviceId: string;
  reason?: string;
}

export interface PendingProductWithDetails extends Product {
  sellerName: string;
  sellerEmail: string;
  organizationName: string;
}

export interface PendingServiceWithDetails extends Service {
  sellerName: string;
  sellerEmail: string;
  organizationName: string;
}

export interface OrganizationStats {
  totalProducts: number;
  pendingProducts: number;
  approvedProducts: number;
  rejectedProducts: number;
  totalServices: number;
  pendingServices: number;
  approvedServices: number;
  rejectedServices: number;
}