import type { Product } from "@/shared/types";

export interface PublicProduct extends Product {
  organizationName: string;
  sellerName: string;
}

export interface ProductSearchParams {
  query?: string;
  organizationId?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
}