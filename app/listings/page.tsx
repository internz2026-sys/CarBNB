import Link from "next/link";
import Image from "next/image";
import { Search, Users, Zap, Settings2, ShieldCheck } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ListingStatus, OwnerStatus } from "@/types";
import { resolveListingPhotoUrl } from "@/lib/listing-assets";
import { getCurrentViewer } from "@/lib/current-user";
import { UserMenu } from "@/components/layout/user-menu";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

type ListingsSearchParams = Promise<{ search?: string; location?: string }>;

export default async function PublicListingsPage({
  searchParams,
}: {
  searchParams: ListingsSearchParams;
}) {
  const { search, location } = await searchParams;
  const trimmedSearch = search?.trim() ?? "";
  const trimmedLocation = location?.trim() ?? "";
  const viewer = await getCurrentViewer();

  const where: Prisma.CarListingWhereInput = {
    status: ListingStatus.ACTIVE,
  };
  if (trimmedSearch) {
    where.OR = [
      { brand: { contains: trimmedSearch, mode: "insensitive" } },
      { model: { contains: trimmedSearch, mode: "insensitive" } },
      { location: { contains: trimmedSearch, mode: "insensitive" } },
    ];
  }
  if (trimmedLocation) {
    where.location = { contains: trimmedLocation, mode: "insensitive" };
  }

  const listings = await db.carListing.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { owner: { select: { fullName: true, status: true } } },
  });

  // Location chips — show top handful of distinct locations from active listings.
  const allActive = await db.carListing.findMany({
    where: { status: ListingStatus.ACTIVE },
    select: { location: true },
  });
  const locationCounts = new Map<string, number>();
  for (const row of allActive) {
    locationCounts.set(row.location, (locationCounts.get(row.location) ?? 0) + 1);
  }
  const topLocations = [...locationCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([loc]) => loc);

  return (
    <div className="min-h-screen bg-surface pb-20 font-sans">
      <header className="sticky top-0 z-30 bg-[rgb(250_248_255_/_0.85)] shadow-[0_8px_24px_rgb(19_27_46_/_0.04)] backdrop-blur-lg">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link className="font-headline text-2xl font-black tracking-tight text-primary" href="/">
            DriveXP
          </Link>
          <div className="flex items-center gap-5">
            {viewer.kind === "customer" ? (
              <UserMenu
                fullName={viewer.fullName}
                links={[{ label: "My bookings", href: "/account" }]}
                roleLabel="Customer"
              />
            ) : viewer.kind === "admin" ? (
              <UserMenu
                fullName={viewer.fullName ?? viewer.email}
                links={[{ label: "Admin dashboard", href: "/dashboard" }]}
                roleLabel="Admin"
              />
            ) : viewer.kind === "host" ? (
              <UserMenu
                fullName={viewer.fullName}
                links={[
                  { label: "Host dashboard", href: "/host/dashboard" },
                  { label: "My cars", href: "/host/cars" },
                  { label: "My bookings", href: "/host/bookings" },
                ]}
                roleLabel="Host"
              />
            ) : (
              <>
                <Link className="text-sm font-semibold text-on-surface-variant hover:text-primary" href="/login">
                  Log in
                </Link>
                <Link
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
                  href="/signup"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
        <div className="mb-8">
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
            Find your next drive
          </h1>
          <p className="mt-2 text-base text-on-surface-variant">
            Browse verified cars from trusted local hosts across Metro Manila.
          </p>
        </div>

        <form action="/listings" className="mb-6" method="GET">
          {trimmedLocation ? (
            <input name="location" type="hidden" value={trimmedLocation} />
          ) : null}
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
            <input
              className="h-12 w-full rounded-full bg-surface-container-low pl-11 pr-4 text-sm text-on-surface outline-none shadow-[0_8px_24px_rgb(19_27_46_/_0.04)]"
              defaultValue={trimmedSearch}
              name="search"
              placeholder="Search by brand, model, or city..."
              type="text"
            />
          </div>
        </form>

        {topLocations.length > 0 ? (
          <div className="mb-8 flex flex-wrap gap-2">
            <Link
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                !trimmedLocation
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high",
              )}
              href={{
                pathname: "/listings",
                query: trimmedSearch ? { search: trimmedSearch } : {},
              }}
            >
              All cities
            </Link>
            {topLocations.map((loc) => {
              const active = trimmedLocation === loc;
              const q: Record<string, string> = { location: loc };
              if (trimmedSearch) q.search = trimmedSearch;
              return (
                <Link
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    active
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high",
                  )}
                  href={{ pathname: "/listings", query: q }}
                  key={loc}
                >
                  {loc}
                </Link>
              );
            })}
          </div>
        ) : null}

        {listings.length === 0 ? (
          <div className="rounded-2xl bg-surface-container-low p-12 text-center">
            <p className="text-lg font-semibold text-on-surface">No listings match your search</p>
            <p className="mt-2 text-sm text-on-surface-variant">
              Try a different keyword or clear your filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => {
              const primaryPhoto = listing.photos[0];
              const photoUrl = primaryPhoto ? resolveListingPhotoUrl(primaryPhoto) : null;
              const verified = listing.owner.status === OwnerStatus.VERIFIED;
              return (
                <Link
                  className="group overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_8px_24px_rgb(19_27_46_/_0.06)] transition hover:shadow-[0_12px_32px_rgb(19_27_46_/_0.1)]"
                  href={`/listings/${listing.id}`}
                  key={listing.id}
                >
                  <div className="relative aspect-[4/3] bg-surface-container">
                    {photoUrl ? (
                      <Image
                        alt={`${listing.brand} ${listing.model}`}
                        className="object-cover transition group-hover:scale-[1.02]"
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        src={photoUrl}
                      />
                    ) : (
                      <div className="grid size-full place-items-center text-sm text-on-surface-variant">
                        Photo coming soon
                      </div>
                    )}
                    {verified ? (
                      <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                        <ShieldCheck className="size-3" />
                        Verified Host
                      </div>
                    ) : null}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-headline text-lg font-bold text-on-surface">
                          {listing.brand} {listing.model}
                        </h2>
                        <p className="text-xs text-on-surface-variant">
                          {listing.year} · {listing.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                          From
                        </p>
                        <p className="font-headline text-lg font-bold text-primary">
                          {peso.format(listing.dailyPrice)}
                          <span className="text-xs font-normal text-on-surface-variant">/day</span>
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-xs text-on-surface-variant">
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3" />
                        {listing.seatingCapacity}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Settings2 className="size-3" />
                        {listing.transmission}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Zap className="size-3" />
                        {listing.fuelType}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
