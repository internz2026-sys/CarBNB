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

// Customer-authenticated routes. Any logged-in user with a `Customer` row
// may access; admins/owners get bounced so their session doesn't confuse
// the customer account UI. The (customer) route group is a URL no-op.
const CUSTOMER_PATHS = ["/account"];

function matchesAny(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const { pathname } = request.nextUrl;

  if (matchesAny(pathname, ADMIN_PATHS)) {
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
    return supabaseResponse;
  }

  if (matchesAny(pathname, CUSTOMER_PATHS)) {
    if (!user?.email) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const customer = await db.customer.findUnique({ where: { email: user.email } });
    if (!customer) {
      // Logged-in but not a customer — send them home rather than into a
      // customer dashboard that'll error.
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
