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

interface CartContextValue {
  cart: Cart;
  addItem: (product: ProductCartItem["product"], quantity: number) => boolean;
  addBooking: (booking: Omit<BookingCartItem, "id" | "type">) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const CART_STORAGE_KEY = "manglara-cart";

function loadCartFromStorage(): Cart {
  if (typeof window === "undefined") {
    return { items: [] };
  }

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
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
                id: legacyItem.product.id,
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

function saveCartToStorage(cart: Cart): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error("Error saving cart to storage:", error);
  }
}

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [cart, setCart] = useState<Cart>({ items: [] });
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setCart(loadCartFromStorage());
    setHasHydrated(true);
  }, []);

  // Do not overwrite a persisted cart with the server-rendered empty state.
  useEffect(() => {
    if (hasHydrated) {
      saveCartToStorage(cart);
    }
  }, [cart, hasHydrated]);

  const addItem = useCallback(
    (product: ProductCartItem["product"], quantity: number): boolean => {
      // Validate stock
      if (product.stock !== undefined && quantity > product.stock) {
        return false;
      }

      setCart((prevCart) => {
        const existingItemIndex = prevCart.items.findIndex(
          (item) => item.type === "product" && item.product.id === product.id,
        );

        if (existingItemIndex >= 0) {
          // Update existing item
          const existingItem = prevCart.items[existingItemIndex];
          const newQuantity = existingItem.quantity + quantity;

          // Validate stock for updated quantity
          if (product.stock !== undefined && newQuantity > product.stock) {
            return prevCart; // Don't update if exceeds stock
          }

          const newItems = [...prevCart.items];
          newItems[existingItemIndex] = {
            ...existingItem,
            quantity: newQuantity,
          } as ProductCartItem;

          return { items: newItems };
        } else {
          // Add new item
          return {
            items: [
              ...prevCart.items,
              { id: product.id, type: "product", product, quantity },
            ],
          };
        }
      });

      return true;
    },
    [],
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
    [],
  );

  const removeItem = useCallback((itemId: string) => {
    setCart((prevCart) => ({
      items: prevCart.items.filter((item) => item.id !== itemId),
    }));
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId);
        return;
      }

      setCart((prevCart) => {
        const item = prevCart.items.find(
          (item) => item.type === "product" && item.product.id === productId,
        );
        if (!item || item.type !== "product") return prevCart;

        // Validate stock
        if (item.product.stock !== undefined && quantity > item.product.stock) {
          return prevCart; // Don't update if exceeds stock
        }

        const newItems = prevCart.items.map((item) =>
          item.type === "product" && item.product.id === productId
            ? { ...item, quantity }
            : item,
        );

        return { items: newItems };
      });
    },
    [removeItem],
  );

  const clearCart = useCallback(() => {
    setCart({ items: [] });
  }, []);

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
