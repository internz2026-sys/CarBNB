import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { BookingStatus, ListingStatus } from "@/types";
import { getCurrentViewer } from "@/lib/current-user";
import { BrandLogo } from "@/components/layout/brand-logo";
import { UserMenu } from "@/components/layout/user-menu";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkAvailability } from "@/lib/availability";
import { ListingCard } from "./listing-card";
import { FilterPanel } from "./filter-panel";
import { SortDropdown } from "./sort-dropdown";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse Cars | DriveXP",
  description:
    "Browse verified cars from trusted local hosts across Metro Manila. Filter by price, vehicle type, transmission, seats, and more.",
};

const SORT_OPTIONS = [
  { slug: "price_asc", label: "Price: Low to High" },
  { slug: "price_desc", label: "Price: High to Low" },
  { slug: "top_rated", label: "Top rated" },
  { slug: "newest", label: "Newest first" },
];

type ListingsSearchParams = Promise<{
  search?: string;
  location?: string;
  from?: string;
  until?: string;
  types?: string | string[];
  transmission?: string;
  fuels?: string | string[];
  seats?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
}>;

function toArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function safeNum(v: string | undefined): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export default async function PublicListingsPage({
  searchParams,
}: {
  searchParams: ListingsSearchParams;
}) {
  const sp = await searchParams;
  const search = sp.search?.trim() ?? "";
  const location = sp.location?.trim() ?? "";
  const from = sp.from?.trim() ?? "";
  const until = sp.until?.trim() ?? "";
  const types = toArray(sp.types);
  const transmission = sp.transmission?.trim() ?? "";
  const fuels = toArray(sp.fuels);
  const seats = safeNum(sp.seats);
  const minPrice = safeNum(sp.minPrice);
  const maxPrice = safeNum(sp.maxPrice);
  const sort = sp.sort && SORT_OPTIONS.some((o) => o.slug === sp.sort)
    ? sp.sort
    : "price_asc";

  const viewer = await getCurrentViewer();

  const where: Prisma.CarListingWhereInput = {
    status: ListingStatus.ACTIVE,
  };
  if (search) {
    where.OR = [
      { brand: { contains: search, mode: "insensitive" } },
      { model: { contains: search, mode: "insensitive" } },
    ];
  }
  if (location) {
    where.location = { contains: location, mode: "insensitive" };
  }
  if (types.length > 0) where.vehicleType = { in: types };
  if (transmission) where.transmission = transmission;
  if (fuels.length > 0) where.fuelType = { in: fuels };
  if (seats !== null) where.seatingCapacity = { gte: seats };
  if (minPrice !== null || maxPrice !== null) {
    where.dailyPrice = {};
    if (minPrice !== null) where.dailyPrice.gte = minPrice;
    if (maxPrice !== null) where.dailyPrice.lte = maxPrice;
  }

  let orderBy:
    | Prisma.CarListingOrderByWithRelationInput
    | Prisma.CarListingOrderByWithRelationInput[];
  switch (sort) {
    case "price_desc":
      orderBy = { dailyPrice: "desc" };
      break;
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    case "top_rated":
      // Listings without reviews land at the bottom (avgRating=0).
      // reviewCount tiebreaks so a 5★ from one rater doesn't outrank a
      // 4.9★ from many.
      orderBy = [{ avgRating: "desc" }, { reviewCount: "desc" }];
      break;
    case "price_asc":
    default:
      orderBy = { dailyPrice: "asc" };
      break;
  }

  // Card data only — just the fields the listing cards render. The availability
  // relations (rules + exceptions + active bookings) are deliberately NOT
  // fetched here: they're only needed for the date-range filter, which is the
  // uncommon path. Loading them on every default page view over-fetches, so we
  // pull them in a targeted second query below only when a date filter applies.
  const listings = await db.carListing.findMany({
    where,
    orderBy,
    include: {
      owner: { select: { fullName: true, status: true } },
      // Tier 15: surface the active fleet manager (if any) so cards can
      // render the "managed by X" dual-host label. Take 1 — the schema
      // (application-enforced) only allows one ACTIVE link per listing.
      fleetLinks: {
        where: { status: "ACTIVE" },
        take: 1,
        select: {
          fleet: { select: { id: true, companyName: true, fullName: true } },
        },
      },
    },
  });

  // Tier 11: load the current customer's favorited listing ids so cards can
  // render their heart in the correct initial state. No-op for guests / hosts
  // / admins (favorites are customer-only).
  const favoritedIds = new Set<string>();
  if (viewer.kind === "customer") {
    const favs = await db.favorite.findMany({
      where: { customerId: viewer.id },
      select: { listingId: true },
    });
    for (const f of favs) favoritedIds.add(f.listingId);
  }

  // Validate the requested date range up front so availability work only
  // happens when it's actually requested and parseable.
  let dateRange: { pickup: Date; returnDate: Date } | null = null;
  if (from && until) {
    const p = new Date(`${from}T00:00:00`);
    const r = new Date(`${until}T00:00:00`);
    if (!Number.isNaN(p.getTime()) && !Number.isNaN(r.getTime()) && p <= r) {
      dateRange = { pickup: p, returnDate: r };
    }
  }

  let filteredListings = listings;
  const dateFilterApplied = dateRange !== null;
  if (dateRange) {
    const { pickup, returnDate } = dateRange;
    // Targeted availability fetch for just the candidate listings — only the
    // rules/exceptions/active-bookings checkAvailability() needs. Date-range is
    // the only filter Prisma can't express directly, hence the in-memory pass.
    const availability = await db.carListing.findMany({
      where: { id: { in: listings.map((l) => l.id) } },
      select: {
        id: true,
        availabilityRules: true,
        exceptions: true,
        bookings: {
          where: {
            status: {
              in: [
                BookingStatus.PENDING,
                BookingStatus.CONFIRMED,
                BookingStatus.ONGOING,
              ],
            },
          },
          select: { pickupDate: true, returnDate: true, status: true },
        },
      },
    });
    const availabilityById = new Map(availability.map((a) => [a.id, a]));
    filteredListings = listings.filter((l) => {
      const a = availabilityById.get(l.id);
      if (!a) return false;
      return checkAvailability({
        pickup,
        returnDate,
        rules: a.availabilityRules,
        exceptions: a.exceptions,
        existingBookings: a.bookings,
      }).ok;
    });
  }

  // Location chips — top distinct locations from active listings, aggregated
  // DB-side (groupBy) instead of fetching every active row and counting them in
  // memory. Unfiltered by current selection so the user can pivot quickly.
  const locationGroups = await db.carListing.groupBy({
    by: ["location"],
    where: { status: ListingStatus.ACTIVE },
    _count: { location: true },
    orderBy: { _count: { location: "desc" } },
    take: 6,
  });
  const topLocations = locationGroups.map((g) => g.location);

  // Build a chip href that preserves all OTHER params (so toggling a city
  // doesn't reset filters or dates).
  function chipHref(loc: string | null): { pathname: string; query: Record<string, string | string[]> } {
    const q: Record<string, string | string[]> = {};
    if (search) q.search = search;
    if (from) q.from = from;
    if (until) q.until = until;
    if (types.length > 0) q.types = types;
    if (transmission) q.transmission = transmission;
    if (fuels.length > 0) q.fuels = fuels;
    if (seats !== null) q.seats = String(seats);
    if (minPrice !== null) q.minPrice = String(minPrice);
    if (maxPrice !== null) q.maxPrice = String(maxPrice);
    if (sort !== "price_asc") q.sort = sort;
    if (loc) q.location = loc;
    return { pathname: "/listings", query: q };
  }

  const filterState = {
    search,
    location,
    from,
    until,
    types,
    transmission,
    fuels,
    seats: seats !== null ? String(seats) : "",
    minPrice: minPrice !== null ? String(minPrice) : "",
    maxPrice: maxPrice !== null ? String(maxPrice) : "",
    sort,
  };

  return (
    <div className="min-h-screen bg-surface pb-20 font-sans">
      <header className="sticky top-0 z-30 bg-[rgb(250_248_255_/_0.85)] shadow-[0_8px_24px_rgb(19_27_46_/_0.04)] backdrop-blur-lg">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link className="flex items-center" href="/">
            <BrandLogo />
          </Link>
          <div className="flex items-center gap-5">
            {viewer.kind === "customer" ? (
              <UserMenu
                fullName={viewer.fullName}
                links={[
                  { label: "My bookings", href: "/account" },
                  { label: "Favorites", href: "/account/favorites" },
                ]}
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
                  { label: "Profile", href: "/host/profile" },
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

        {/* Hero search — Where + From + Until + submit. Submitting starts a
            fresh search (no hidden filter inputs) so users can quickly pivot. */}
        <form
          action="/listings"
          className="mb-4 rounded-2xl bg-surface-container-lowest p-3 shadow-[0_8px_24px_rgb(19_27_46_/_0.06)]"
          method="GET"
        >
          <div className="grid gap-2 md:grid-cols-[1.4fr_1fr_1fr_auto]">
            <label className="relative flex flex-col">
              <span className="px-3 pt-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Where
              </span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
                <Input
                  className="border-0 bg-transparent pl-9 focus-visible:ring-0"
                  defaultValue={location}
                  name="location"
                  placeholder="City or area"
                />
              </div>
            </label>
            <label className="flex flex-col">
              <span className="px-3 pt-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                From
              </span>
              <Input
                className="border-0 bg-transparent focus-visible:ring-0"
                defaultValue={from}
                name="from"
                type="date"
              />
            </label>
            <label className="flex flex-col">
              <span className="px-3 pt-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Until
              </span>
              <Input
                className="border-0 bg-transparent focus-visible:ring-0"
                defaultValue={until}
                name="until"
                type="date"
              />
            </label>
            <Button className="md:self-stretch" size="lg" type="submit">
              <Search className="mr-2 size-4" />
              Search
            </Button>
          </div>
          <div className="mt-2 px-3">
            <details className="text-sm">
              <summary className="cursor-pointer text-on-surface-variant hover:text-primary">
                Search by brand or model name
              </summary>
              <div className="mt-2">
                <Input
                  defaultValue={search}
                  name="search"
                  placeholder="e.g. Toyota Vios, Fortuner, Honda…"
                />
              </div>
            </details>
          </div>
        </form>

        {/* City chips — quick filter shortcuts. Preserve everything else. */}
        {topLocations.length > 0 ? (
          <div className="mb-8 flex flex-wrap gap-2">
            <Link
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                !location
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high",
              )}
              href={chipHref(null)}
            >
              All cities
            </Link>
            {topLocations.map((loc) => {
              const active = location === loc;
              return (
                <Link
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    active
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high",
                  )}
                  href={chipHref(loc)}
                  key={loc}
                >
                  {loc}
                </Link>
              );
            })}
          </div>
        ) : null}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-on-surface-variant">
            <span className="font-bold text-on-surface">{filteredListings.length}</span>{" "}
            {filteredListings.length === 1 ? "car" : "cars"}
            {dateFilterApplied ? " available for your dates" : " found"}
          </p>
          <SortDropdown options={SORT_OPTIONS} value={sort} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <FilterPanel state={filterState} />
          </aside>

          <div>
            {filteredListings.length === 0 ? (
              <div className="rounded-2xl bg-surface-container-low p-12 text-center">
                <p className="text-lg font-semibold text-on-surface">
                  {dateFilterApplied
                    ? "No cars are available across those dates"
                    : "No listings match your search"}
                </p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Try a different keyword, broader dates, or clear your filters.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredListings.map((listing) => {
                  const fleetEntry = listing.fleetLinks[0];
                  const activeFleet = fleetEntry
                    ? {
                        id: fleetEntry.fleet.id,
                        displayName:
                          fleetEntry.fleet.companyName ?? fleetEntry.fleet.fullName,
                      }
                    : null;
                  return (
                    <ListingCard
                      fromParam={from || undefined}
                      isFavorited={favoritedIds.has(listing.id)}
                      key={listing.id}
                      listing={{ ...listing, activeFleet }}
                      untilParam={until || undefined}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
