import { Metadata } from "next";
import {
  QueryClient,
  HydrationBoundary,
  dehydrate,
} from "@tanstack/react-query";

import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  TypographyH1,
  TypographyLarge,
  TypographyMuted,
} from "@/shared/components/ui/typography";
import { PageWrapper } from "@/shared/components/page-wrapper";
import { MobileWrapper } from "@/shared/components/mobile-wrapper";
import { Card } from "@/shared/components/ui/card";

import { getOrganizations } from "@/features/organizations/actions/get-organizations";
import { OrganizationsSidebar } from "@/features/organizations/components/organizations-sidebar";
import { CreateOrganizationButton } from "@/features/organizations/components/create-organization-button";

export const metadata: Metadata = {
  title: "Manglara | Organizaciones",
};

export default async function OrganizationsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let organizationsCount = 0;

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["organization", "list"],
    queryFn: async () => {
      const { data } = await getOrganizations();

      organizationsCount = data?.length ?? 0;

      return data;
    },
  });

  if (organizationsCount === 0)
    return (
      <div className="flex h-full flex-col space-y-8">
        <Header />

        <div className="flex w-full flex-1 items-center justify-center">
          <Card className="-mt-12 flex flex-col items-center justify-center rounded-4xl p-8">
            <TypographyLarge className="text-center text-xl font-medium">
              No hay organizaciones creadas 😢
            </TypographyLarge>
          </Card>
        </div>
      </div>
    );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex h-full flex-col space-y-8">
        <Header />

        <div className="flex min-h-0 flex-1 gap-6">
          <OrganizationsSidebar />

          <PageWrapper wrapperPage="/organizations">
            <ScrollArea className="h-full w-1 flex-1">
              <div className="space-y-8 px-4 pb-16">{children}</div>
            </ScrollArea>
          </PageWrapper>
        </div>
      </div>
    </HydrationBoundary>
  );
}

function Header() {
  return (
    <MobileWrapper wrapperPage="/organizations">
      <div className="flex w-full items-center justify-between">
        <div className="space-y-2">
          <TypographyH1>Organizaciones</TypographyH1>

          <TypographyMuted>
            Aquí podrás administrar todas las organizaciones de Manglara. 🌴
          </TypographyMuted>
        </div>

        <CreateOrganizationButton />
      </div>
    </MobileWrapper>
  );
}
