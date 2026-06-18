import { useQuery } from "@tanstack/react-query";

import { authClient } from "@/shared/lib/better-auth/client";
import { useInMobileWrapper } from "@/shared/hooks/use-in-mobile-wrapper";

import { getAllOrganizations } from "@/features/organizations/actions/get-all-organizations";

export const useOrganizationsSidebar = () => {
  const { isMobile, isMounted, isWrapperPage } = useInMobileWrapper({
    wrapperPage: "/organizations",
  });

  const { data, isLoading, isError, isSuccess, isRefetching, refetch } =
    useQuery({
      queryKey: ["organization", "list"],
      queryFn: async () => {
        const { data, error } = await getAllOrganizations();

        if (error) return Promise.reject(error);

        return data;
      },
    });

  const setActiveOrganization = async (organizationSlug: string) =>
    await authClient.organization.setActive({
      organizationSlug,
    });

  return {
    isMobile,
    isMounted,
    isWrapperPage,
    data,
    isLoading,
    isError,
    isSuccess,
    isRefetching,
    refetch,
    setActiveOrganization,
  };
};
