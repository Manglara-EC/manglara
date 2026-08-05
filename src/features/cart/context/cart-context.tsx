"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

import type { CartItem, Cart } from "@/features/cart/types";

interface CartContextValue {
  cart: Cart;
  addItem: (
    product: CartItem["product"],
    quantity: number,
    reservationDate?: string,
  ) => boolean;
  removeItem: (productId: string, reservationDate?: string) => void;
  updateQuantity: (productId: string, quantity: number, reservationDate?: string) => void;
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
      return JSON.parse(stored);
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

// Dos items del carrito son "el mismo" si es el mismo producto Y la misma
// fecha de reserva (o ninguno de los dos tiene fecha, para productos normales).
// Así, el mismo producto reservado para dos fechas distintas queda como dos
// líneas separadas del carrito.
function isSameCartLine(
  item: CartItem,
  productId: string,
  reservationDate?: string,
): boolean {
  return item.product.id === productId && item.reservationDate === reservationDate;
}

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [cart, setCart] = useState<Cart>(loadCartFromStorage);

  useEffect(() => {
    saveCartToStorage(cart);
  }, [cart]);

  const addItem = useCallback(
    (product: CartItem["product"], quantity: number, reservationDate?: string): boolean => {
      if (product.isReservable && !reservationDate) {
        // No se puede agregar un producto reservable sin fecha.
        return false;
      }

      // Validación de sanidad: nunca exceder el stock/capacidad total del
      // producto. La disponibilidad real para la fecha elegida (en el caso
      // de productos reservables) ya debió validarse antes de llamar a esto
      // (ver useProductAvailability); la validación definitiva ocurre en el
      // servidor al momento de la compra.
      if (product.stock !== undefined && quantity > product.stock) {
        return false;
      }

      let didAdd = true;

      setCart((prevCart) => {
        const existingItemIndex = prevCart.items.findIndex((item) =>
          isSameCartLine(item, product.id, reservationDate),
        );

        if (existingItemIndex >= 0) {
          const existingItem = prevCart.items[existingItemIndex];
          const newQuantity = existingItem.quantity + quantity;

          if (product.stock !== undefined && newQuantity > product.stock) {
            didAdd = false;
            return prevCart;
          }

          const newItems = [...prevCart.items];
          newItems[existingItemIndex] = {
            ...existingItem,
            quantity: newQuantity,
          };

          return { items: newItems };
        } else {
          return {
            items: [...prevCart.items, { product, quantity, reservationDate }],
          };
        }
      });

      return didAdd;
    },
    [],
  );

  const removeItem = useCallback((productId: string, reservationDate?: string) => {
    setCart((prevCart) => ({
      items: prevCart.items.filter(
        (item) => !isSameCartLine(item, productId, reservationDate),
      ),
    }));
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number, reservationDate?: string) => {
      if (quantity <= 0) {
        removeItem(productId, reservationDate);
        return;
      }

      setCart((prevCart) => {
        const item = prevCart.items.find((item) =>
          isSameCartLine(item, productId, reservationDate),
        );
        if (!item) return prevCart;

        if (item.product.stock !== undefined && quantity > item.product.stock) {
          return prevCart;
        }

        const newItems = prevCart.items.map((item) =>
          isSameCartLine(item, productId, reservationDate) ? { ...item, quantity } : item,
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
      (total, item) => total + Number(item.product.price) * item.quantity,
      0
    );
  }, [cart.items]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem,
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
