"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

import type {
  BookingCartItem,
  CartItem,
  Cart,
  ProductCartItem,
} from "@/features/cart/types";
import { authClient } from "@/shared/lib/better-auth/client";

interface CartContextValue {
  cart: Cart;
  addItem: (
    product: ProductCartItem["product"],
    quantity: number,
    reservationDate?: string,
  ) => boolean;
  addBooking: (booking: Omit<BookingCartItem, "id" | "type">) => void;
  removeItem: (productId: string, reservationDate?: string) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    reservationDate?: string,
  ) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const LEGACY_CART_STORAGE_KEY = "manglara-cart";
const EMPTY_CART: Cart = { items: [] };

function cartStorageKey(userId: string): string {
  return `manglara-cart:${userId}`;
}

// Un producto reservado usa un id compuesto "productId::YYYY-MM-DD" para que
// la misma reserva en dos fechas distintas quede como dos líneas separadas
// del carrito. Un producto normal (o sin fecha elegida) usa solo su id.
function buildProductCartItemId(
  productId: string,
  reservationDate?: string,
): string {
  return reservationDate ? `${productId}::${reservationDate}` : productId;
}

function loadCartFromStorage(userId: string): Cart {
  if (typeof window === "undefined") {
    return { items: [] };
  }

  try {
    const stored = localStorage.getItem(cartStorageKey(userId));
    if (stored) {
      const parsed = JSON.parse(stored) as { items?: unknown[] };
      const items = Array.isArray(parsed.items) ? parsed.items : [];

      // Cart entries stored before reservations were supported had no discriminator.
      return {
        items: items.flatMap((item) => {
          if (!item || typeof item !== "object") return [];
          if ("type" in item) return [item as CartItem];
          if ("product" in item && "quantity" in item) {
            const legacyItem = item as Omit<ProductCartItem, "id" | "type">;
            return [
              {
                ...legacyItem,
                id: buildProductCartItemId(
                  legacyItem.product.id,
                  legacyItem.reservationDate,
                ),
                type: "product" as const,
              },
            ];
          }
          return [];
        }),
      };
    }
  } catch (error) {
    console.error("Error loading cart from storage:", error);
  }

  return { items: [] };
}

function saveCartToStorage(userId: string, cart: Cart): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(cartStorageKey(userId), JSON.stringify(cart));
  } catch (error) {
    console.error("Error saving cart to storage:", error);
  }
}

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const { data: session, isPending } = authClient.useSession();
  const userId = isPending ? undefined : session?.user.id;
  const [storedCart, setStoredCart] = useState<Cart>(EMPTY_CART);
  const [loadedForUserId, setLoadedForUserId] = useState<string | null>(null);
  const cart = userId && loadedForUserId === userId ? storedCart : EMPTY_CART;

  useEffect(() => {
    // The old key has no owner, so its contents cannot safely be assigned to
    // whichever account happens to sign in next.
    try {
      localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
    } catch (error) {
      console.error("Error removing legacy cart from storage:", error);
    }

    if (!userId) {
      setStoredCart(EMPTY_CART);
      setLoadedForUserId(null);
      return;
    }

    setStoredCart(loadCartFromStorage(userId));
    setLoadedForUserId(userId);
  }, [userId]);

  // Do not overwrite a persisted cart with the server-rendered empty state.
  useEffect(() => {
    if (userId && loadedForUserId === userId) {
      saveCartToStorage(userId, storedCart);
    }
  }, [storedCart, loadedForUserId, userId]);

  const setCart = useCallback(
    (update: (previousCart: Cart) => Cart) => {
      if (!userId || loadedForUserId !== userId) return;

      setStoredCart((previousCart) => update(previousCart));
    },
    [userId, loadedForUserId],
  );

  const addItem = useCallback(
    (
      product: ProductCartItem["product"],
      quantity: number,
      reservationDate?: string,
    ): boolean => {
      if (!userId || loadedForUserId !== userId) return false;

      if (product.isReservable && !reservationDate) {
        // No se puede agregar un producto reservable sin fecha.
        return false;
      }

      if (product.stock !== undefined && quantity > product.stock) {
        return false;
      }

      const itemId = buildProductCartItemId(product.id, reservationDate);
      let didAdd = true;

      setCart((prevCart) => {
        const existingItemIndex = prevCart.items.findIndex(
          (item) => item.type === "product" && item.id === itemId,
        );

        if (existingItemIndex >= 0) {
          // Update existing item
          const existingItem = prevCart.items[existingItemIndex];
          const newQuantity = existingItem.quantity + quantity;

          // Validate stock for updated quantity
          if (product.stock !== undefined && newQuantity > product.stock) {
            didAdd = false;
            return prevCart; // Don't update if exceeds stock
          }

          const newItems = [...prevCart.items];
          newItems[existingItemIndex] = {
            ...existingItem,
            quantity: newQuantity,
          } as ProductCartItem;

          return { items: newItems };
        } else {
          const newItem: ProductCartItem = {
            id: itemId,
            type: "product",
            product,
            quantity,
            reservationDate,
          };
          return {
            items: [...prevCart.items, newItem],
          };
        }
      });

      return didAdd;
    },
    [userId, loadedForUserId, setCart],
  );

  const addBooking = useCallback(
    (booking: Omit<BookingCartItem, "id" | "type">) => {
      setCart((prevCart) => ({
        items: [
          ...prevCart.items,
          { ...booking, id: crypto.randomUUID(), type: "booking" },
        ],
      }));
    },
    [setCart],
  );

  const removeItem = useCallback(
    (itemId: string) => {
      setCart((prevCart) => ({
        items: prevCart.items.filter((item) => item.id !== itemId),
      }));
    },
    [setCart],
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId);
        return;
      }

      setCart((prevCart) => {
        const item = prevCart.items.find((item) => item.id === productId);
        if (!item || item.type !== "product") return prevCart;

        // Validate stock
        if (item.product.stock !== undefined && quantity > item.product.stock) {
          return prevCart; // Don't update if exceeds stock
        }

        const newItems = prevCart.items.map((item) =>
          item.id === productId ? { ...item, quantity } : item,
        );

        return { items: newItems };
      });
    },
    [removeItem, setCart],
  );

  const clearCart = useCallback(() => {
    setCart(() => EMPTY_CART);
  }, [setCart]);

  const getTotalItems = useCallback(() => {
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }, [cart.items]);

  const getTotalPrice = useCallback(() => {
    return cart.items.reduce(
      (total, item) =>
        total +
        (item.type === "product"
          ? Number(item.product.price) * item.quantity
          : item.estimatedTotal),
      0,
    );
  }, [cart.items]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem,
        addBooking,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
