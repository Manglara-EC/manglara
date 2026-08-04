import type { PublicProduct } from "@/features/products/types";

export interface ProductCartItem {
  id: string;
  type: "product";
  product: PublicProduct;
  quantity: number;
  // Solo aplica si product.isReservable es true. Formato "YYYY-MM-DD".
  reservationDate?: string;
}

export interface BookingCartItem {
  id: string;
  type: "booking";
  serviceId: string;
  serviceName: string;
  serviceImage?: string | null;
  estimatedUnitPrice: string;
  estimatedTotal: number;
  startDate: string;
  endDate: string;
  quantity: number;
  notes?: string;
}

export type CartItem = ProductCartItem | BookingCartItem;

export interface Cart {
  items: CartItem[];
}
