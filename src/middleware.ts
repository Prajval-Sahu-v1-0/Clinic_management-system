import { auth } from "@/../auth";
import { NextResponse } from "next/server";

// Known role slugs are lowercase alpha strings.
// This regex ensures we only intercept valid role-looking paths
// and skip things like _next, favicon.ico, manifest.json, etc.
const ROLE_SLUG = /^[a-z][a-z0-9_-]*$/;

// Paths that should never be intercepted as role routes
const SKIP_PREFIXES = ["api", "_next", "favicon.ico"];

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const pathname = nextUrl.pathname;

  // Extract the first path segment
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  // Skip: root path, non-role paths, and known static paths
  if (
    !firstSegment ||
    SKIP_PREFIXES.some((p) => firstSegment === p || firstSegment.startsWith(p)) ||
    !ROLE_SLUG.test(firstSegment)
  ) {
    return NextResponse.next();
  }

  const requestedRole = firstSegment;

  // Not authenticated → redirect to login
  if (!session) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Get user's assigned roles from session token (with fallback)
  const userRoles: string[] = (session.user as any)?.roles
    ?? [(session.user as any)?.role ?? "patient"];

  // Check if the user has the requested role
  if (!userRoles.includes(requestedRole)) {
    const primaryRole = userRoles[0] ?? "patient";

    // Guard against redirect loops
    if (primaryRole === requestedRole) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL(`/${primaryRole}`, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Only match paths that look like role dashboards:
    // /<word> or /<word>/anything
    // Excludes: api, _next, static files, and the root /
    "/((?!api|_next/static|_next/image|favicon\\.ico).*)",
  ],
};