"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";

export type FavoriteToggleResult =
  | { ok: true; favorited: boolean }
  | { ok: false; error: string; needsLogin?: boolean; notACustomer?: boolean };

// Resolves to one of three states so the client can disambiguate:
// - guest (not authed) → needs to log in
// - authed but no Customer row → admin or host trying to favorite; no login
//   prompt would help, so we surface a different message
// - authed customer → ready to toggle
async function resolveCustomerAuth(): Promise<
  | { kind: "guest" }
  | { kind: "not-customer" }
  | { kind: "customer"; customer: Awaited<ReturnType<typeof db.customer.findUnique>> }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { kind: "guest" };
  const customer = await db.customer.findUnique({ where: { email: user.email } });
  if (!customer) return { kind: "not-customer" };
  return { kind: "customer", customer };
}

// Idempotent toggle. Inserts the (customer, listing) pair if missing,
// deletes it if present. Returns the resulting favorited state so the
// client can update its local UI without a re-render round-trip.
export async function toggleFavoriteAction(
  listingId: string,
): Promise<FavoriteToggleResult> {
  if (typeof listingId !== "string" || listingId.length === 0) {
    return { ok: false, error: "Missing listing id." };
  }

  const auth = await resolveCustomerAuth();
  if (auth.kind === "guest") {
    return {
      ok: false,
      error: "Log in as a customer to save listings.",
      needsLogin: true,
    };
  }
  if (auth.kind === "not-customer") {
    return {
      ok: false,
      error: "Only customer accounts can save favorites.",
      notACustomer: true,
    };
  }
  const customer = auth.customer!;

  const listing = await db.carListing.findUnique({
    where: { id: listingId },
    select: { id: true },
  });
  if (!listing) {
    return { ok: false, error: "Listing not found." };
  }

  const existing = await db.favorite.findUnique({
    where: {
      customerId_listingId: {
        customerId: customer.id,
        listingId,
      },
    },
  });

  if (existing) {
    await db.favorite.delete({ where: { id: existing.id } });
    revalidatePath("/account/favorites");
    return { ok: true, favorited: false };
  }

  await db.favorite.create({
    data: {
      customerId: customer.id,
      listingId,
    },
  });
  revalidatePath("/account/favorites");
  return { ok: true, favorited: true };
}
