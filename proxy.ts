import { NextResponse } from "next/server";

export async function proxy() {
  const response = NextResponse.next();

  response.headers.set("X-Robots-Tag", "noindex, nofollow");

  return response;
}

export const config = {
  matcher: [
    "/account/:path*",
    "/admin/:path*",
    "/dashboard/:path*",
    "/create-pet/:path*",
    "/print/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/auth/callback",
  ],
};
