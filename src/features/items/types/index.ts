import type { ItemType, Product, Service } from "@/shared/types";
import type { PublicProduct } from "@/features/products/types";
import type { PublicService } from "@/features/services/types";

export type PublicItem = (PublicProduct & { type: "product" }) | (PublicService & { type: "service" });

export interface ItemSearchParams {
  query?: string;
  organizationId?: string;
  minPrice?: number;
  maxPrice?: number;
  itemType?: ItemType;
  page?: number;
  pageSize?: number;
}

