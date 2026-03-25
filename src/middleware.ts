import { auth } from "@/../auth";
import { NextResponse } from "next/server";

const roleRoutes: Record<string, string[]> = {
  "/admin": ["admin"],
  "/staff": ["staff"],
  "/patient": ["patient"],
};

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const pathname = nextUrl.pathname;

  // Find matching protected route
  const protectedRoute = Object.keys(roleRoutes).find((route) =>
    pathname.startsWith(route)
  );

  // Not authenticated - redirect to login
  if (protectedRoute && !session) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Authenticated but wrong role - redirect to correct dashboard
  if (protectedRoute && session) {
    const requiredRoles = roleRoutes[protectedRoute];
    const userRole = session.user?.role;

    if (!userRole || !requiredRoles.includes(userRole)) {
      const correctRoute = `/${userRole || "patient"}`;
      return NextResponse.redirect(new URL(correctRoute, req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/staff/:path*", "/patient/:path*"],
};