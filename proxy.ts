import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { db } from "@/lib/db";

// Admin-only routes. The (admin) route group in app/ doesn't appear in the
// URL, so we match top-level path segments directly.
const ADMIN_PATHS = [
  "/dashboard",
  "/owners",
  "/car-listings",
  "/bookings",
  "/customers",
  "/accounting",
  "/availability",
  "/calendar",
  "/reports",
  "/settings",
];

function isAdminPath(pathname: string) {
  return ADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const { pathname } = request.nextUrl;

  if (isAdminPath(pathname)) {
    if (!user?.email) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // DB is the source of truth for role — auth metadata can be spoofed by
    // callers that use the anon key directly.
    const admin = await db.user.findUnique({ where: { email: user.email } });
    if (!admin) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Run on all routes except static assets and Next internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
