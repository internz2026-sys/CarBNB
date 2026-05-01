import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";

import { db } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { ListingStatus } from "@/types";
import { UserMenu } from "@/components/layout/user-menu";
import { ListingCard } from "@/app/listings/listing-card";

export const dynamic = "force-dynamic";

export default async function CustomerFavoritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // proxy.ts already guarantees we got here as a logged-in customer.
  const customer = await db.customer.findUnique({ where: { email: user!.email! } });
  if (!customer) {
    return null;
  }

  const favorites = await db.favorite.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        include: { owner: { select: { status: true } } },
      },
    },
  });

  // Filter to ACTIVE listings — show de-listed favorites as a separate section
  // would be a nice polish but isn't in scope. Suspended/inactive listings just
  // don't render here; the Favorite row stays in the DB for if they reactivate.
  const activeFavorites = favorites.filter(
    (f) => f.listing.status === ListingStatus.ACTIVE,
  );

  return (
    <div className="min-h-screen bg-surface pb-16 font-sans">
      <header className="sticky top-0 z-30 bg-[rgb(250_248_255_/_0.85)] shadow-[0_8px_24px_rgb(19_27_46_/_0.04)] backdrop-blur-lg">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link className="flex items-center" href="/">
            <Image
              alt="DriveXP"
              className="h-8 w-auto"
              height={32}
              priority
              src="/driveXP-logo-wordmark.png"
              width={129}
            />
          </Link>
          <div className="flex items-center gap-5">
            <Link className="text-sm font-semibold text-on-surface-variant hover:text-primary" href="/listings">
              Browse cars
            </Link>
            <UserMenu
              fullName={customer.fullName}
              links={[
                { label: "My bookings", href: "/account" },
                { label: "Favorites", href: "/account/favorites" },
              ]}
              roleLabel="Customer"
            />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 pt-10 sm:px-6">
        <div className="mb-8">
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
            Favorites
          </h1>
          <p className="mt-2 text-base text-on-surface-variant">
            Cars you&apos;ve saved for later.
          </p>
        </div>

        {activeFavorites.length === 0 ? (
          <div className="rounded-2xl bg-surface-container-low p-12 text-center">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-rose-100 text-rose-500">
              <Heart className="size-6" />
            </div>
            <p className="text-lg font-semibold text-on-surface">No favorites yet</p>
            <p className="mt-2 text-sm text-on-surface-variant">
              Tap the heart on any listing to save it here for later.
            </p>
            <Link
              className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary hover:opacity-95"
              href="/listings"
            >
              Browse cars
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activeFavorites.map((f) => (
              <ListingCard
                isFavorited
                key={f.id}
                listing={f.listing}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
