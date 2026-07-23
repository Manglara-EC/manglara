import { headers } from "next/headers";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { AppSidebar } from "@/shared/components/app-sidebar";
import { CartButton } from "@/features/cart/components/cart-button";
import { auth } from "@/shared/lib/better-auth/server";

export default async function StoriesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["session", "detail"],
    queryFn: async () => {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      return session;
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex h-svh gap-6 overflow-hidden px-2 py-4 sm:px-6 sm:py-8 md:p-10">
        <AppSidebar />

        <div className="min-w-0 flex-1 flex flex-col overflow-hidden">
          <div className="flex justify-end mb-4">
            <CartButton />
          </div>
          <main className="h-full w-full flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </HydrationBoundary>
  );
}
