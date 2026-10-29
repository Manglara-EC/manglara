export const REDIRECT_PARAM = "redirect";

/**
 * Solo acepta rutas internas ("/explore", "/products/123?x=1") para evitar
 * open redirects hacia dominios externos ("//evil.com", "https://...").
 */
export const getSafeRedirect = (
  value: string | null | undefined,
): string | null => {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.startsWith("/\\")) return null;

  return value;
};

/**
 * Lee el parámetro `redirect` de la URL actual (solo en cliente).
 * Se usa dentro de handlers para no requerir un Suspense boundary.
 */
export const getRedirectFromLocation = (): string | null => {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  return getSafeRedirect(params.get(REDIRECT_PARAM));
};

/** Destino tras autenticarse: la URL de retorno o `/home`. */
export const getPostAuthRedirect = (): string =>
  getRedirectFromLocation() ?? "/home";

/** Construye `/sign-in?redirect=...` (o `/sign-up`) conservando la URL de retorno. */
export const buildAuthURL = (
  path: "/sign-in" | "/sign-up" | "/2fa",
  redirectTo: string | null | undefined,
): string => {
  const safe = getSafeRedirect(redirectTo);
  if (!safe) return path;

  return `${path}?${REDIRECT_PARAM}=${encodeURIComponent(safe)}`;
};
