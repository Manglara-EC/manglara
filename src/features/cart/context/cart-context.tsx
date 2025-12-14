"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

import type { CartItem, Cart } from "@/features/cart/types";

interface CartContextValue {
  cart: Cart;
  addItem: (product: CartItem["product"], quantity: number) => boolean;
  removeItem: (productId: string) => void;
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

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [cart, setCart] = useState<Cart>(loadCartFromStorage);

  // Save to localStorage whenever cart changes
  useEffect(() => {
    saveCartToStorage(cart);
  }, [cart]);

  const addItem = useCallback((product: CartItem["product"], quantity: number): boolean => {
    // Validate stock
    if (product.stock !== undefined && quantity > product.stock) {
      return false;
    }

    setCart((prevCart) => {
      const existingItemIndex = prevCart.items.findIndex(
        (item) => item.product.id === product.id
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
        };

        return { items: newItems };
      } else {
        // Add new item
        return {
          items: [...prevCart.items, { product, quantity }],
        };
      }
    });

    return true;
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCart((prevCart) => ({
      items: prevCart.items.filter((item) => item.product.id !== productId),
    }));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setCart((prevCart) => {
      const item = prevCart.items.find((item) => item.product.id === productId);
      if (!item) return prevCart;

      // Validate stock
      if (item.product.stock !== undefined && quantity > item.product.stock) {
        return prevCart; // Don't update if exceeds stock
      }

      const newItems = prevCart.items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );

      return { items: newItems };
    });
  }, [removeItem]);

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
