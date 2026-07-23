import type { Service } from "@/shared/types";

export interface PublicService extends Service {
  organizationName: string;
  sellerName: string;
}

export interface ServiceSearchParams {
  query?: string;
  organizationId?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
}
