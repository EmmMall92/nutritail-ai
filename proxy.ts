import { NextRequest, NextResponse } from "next/server";

import {
  isLocalizedRoute,
  localeRequestHeader,
  stripLocalePrefix,
  type Locale,
} from "@/lib/i18n/config";

const noIndexPrefixes = ["/account", "/admin", "/dashboard", "/create-pet", "/print"];
const noIndexRoutes = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
]);

function shouldNoIndex(pathname: string) {
  return (
    noIndexRoutes.has(pathname) ||
    noIndexPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  );
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isEnglishPath = pathname === "/en" || pathname.startsWith("/en/");
  const shouldRewrite = isEnglishPath && isLocalizedRoute(pathname);
  const locale: Locale = shouldRewrite ? "en" : "el";
  const internalPath = shouldRewrite ? stripLocalePrefix(pathname) : pathname;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(localeRequestHeader, locale);

  let response: NextResponse;

  if (shouldRewrite) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = internalPath;
    response = NextResponse.rewrite(rewriteUrl, {
      request: { headers: requestHeaders },
    });
  } else {
    response = NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  if (shouldNoIndex(internalPath)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
