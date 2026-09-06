import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session";

const PROTECTED_PATHS = ["/dashboard", "/assistant", "/calendar", "/conflicts", "/tasks", "/subjects", "/exams", "/settings"];
const AUTH_PATHS = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);

  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  const isAuthPage = AUTH_PATHS.some((path) => pathname.startsWith(path));

  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/assistant/:path*", "/calendar/:path*", "/conflicts/:path*", "/tasks/:path*", "/subjects/:path*", "/exams/:path*", "/settings/:path*", "/login", "/register"],
};