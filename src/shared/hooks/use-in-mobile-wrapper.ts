import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

import { useIsMobile } from "@/shared/hooks/use-mobile";

export const useInMobileWrapper = ({
  wrapperPage,
}: {
  wrapperPage: string;
}) => {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  const isWrapperPage =
    pathname === wrapperPage || pathname === `/${wrapperPage}`;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return {
    isMounted,
    isMobile,
    isWrapperPage,
  };
};
