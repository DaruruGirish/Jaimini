import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { homeForRole } from "@/lib/roles";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/verify") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/uploads");

  if (isPublic) return NextResponse.next();

  if (!req.auth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const role = req.auth.user.role;
  const home = homeForRole(role);
  if (pathname.startsWith("/principal") && role !== "PRINCIPAL") {
    return NextResponse.redirect(new URL(home, req.url));
  }
  if (pathname.startsWith("/teacher") && role !== "CLASS_TEACHER") {
    return NextResponse.redirect(new URL(home, req.url));
  }
  if (pathname.startsWith("/student") && role !== "STUDENT") {
    return NextResponse.redirect(new URL(home, req.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$|.*\\.png$).*)"],
};
