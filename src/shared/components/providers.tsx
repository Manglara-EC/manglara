"use client";

import { FC, PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { Toaster } from "@/shared/components/ui/sonner";
import { ThemeProvider } from "@/shared/components/theme-provider";
import { getQueryClient } from "@/shared/lib/react-query/get-query-client";
import { CartProvider } from "@/features/cart/context/cart-context";

export const Providers: FC<PropsWithChildren> = ({ children }) => {
  const queryClient = getQueryClient();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="tropical"
      themes={["tropical", "light", "dark"]}
      enableSystem={false}
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <CartProvider>
          {children}

          <ReactQueryDevtools initialIsOpen={false} />
        </CartProvider>
      </QueryClientProvider>

      <Toaster />
    </ThemeProvider>
  );
};
