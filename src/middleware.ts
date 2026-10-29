import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

import {
  buildAuthURL,
  getSafeRedirect,
  REDIRECT_PARAM,
} from "@/shared/utils/redirect";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const authURLs = [
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/reset-password",
    "/2fa",
    "/recovery",
  ];
  const isAuthURL = authURLs.includes(pathname);

  const publicURLs: string[] = ["/terms", "/privacy"];
  const isPublicURL = publicURLs.includes(pathname);

  // Navegación de invitado (solo lectura): inicio, catálogo y detalles.
  // Las mutaciones siguen protegidas en cada server action / API route.
  const guestURLs: string[] = ["/", "/home", "/explore"];
  const guestURLPrefixes: string[] = ["/products/", "/services/"];
  const isGuestURL =
    guestURLs.includes(pathname) ||
    guestURLPrefixes.some((prefix) => pathname.startsWith(prefix));

  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: "manglara",
  });

  if (isPublicURL || (isGuestURL && !sessionCookie)) {
    return NextResponse.next();
  }

  if (!sessionCookie) {
    return isAuthURL
      ? NextResponse.next()
      : NextResponse.redirect(
          new URL(buildAuthURL("/sign-in", pathname + search), request.url),
        );
  }

  if (isAuthURL) {
    const redirectTo =
      getSafeRedirect(request.nextUrl.searchParams.get(REDIRECT_PARAM)) ??
      "/home";

    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
