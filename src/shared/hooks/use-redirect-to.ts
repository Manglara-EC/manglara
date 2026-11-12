"use client";

import { useEffect, useState } from "react";

import { getRedirectFromLocation } from "@/shared/utils/redirect";

/**
 * URL de retorno (`?redirect=`) para enlazar entre pantallas de auth.
 * Se lee tras el montaje para no requerir un Suspense boundary con
 * `useSearchParams` en páginas estáticas.
 */
export const useRedirectTo = () => {
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    setRedirectTo(getRedirectFromLocation());
  }, []);

  return redirectTo;
};
