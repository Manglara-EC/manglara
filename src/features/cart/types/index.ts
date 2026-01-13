import type { PublicProduct } from "@/features/products/types";

export interface CartItem {
  product: PublicProduct;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
}
