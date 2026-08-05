import type { PublicProduct } from "@/features/products/types";

export interface CartItem {
  product: PublicProduct;
  quantity: number;
  // Solo aplica si product.isReservable es true. Formato "YYYY-MM-DD".
  reservationDate?: string;
}

export interface Cart {
  items: CartItem[];
}
