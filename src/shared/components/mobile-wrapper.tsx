"use client";

import { FC, PropsWithChildren } from "react";

import { useInMobileWrapper } from "@/shared/hooks/use-in-mobile-wrapper";

interface Props {
  wrapperPage: string;
}

export const MobileWrapper: FC<PropsWithChildren<Props>> = ({
  children,
  wrapperPage,
}) => {
  const { isMobile, isMounted, isWrapperPage } = useInMobileWrapper({
    wrapperPage,
  });

  if (!isMounted) return null;

  if (isMobile && !isWrapperPage) return null;

  return children;
};
