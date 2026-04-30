import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { BookingStatus, ListingStatus } from "@/types";
import { getCurrentViewer } from "@/lib/current-user";
import { UserMenu } from "@/components/layout/user-menu";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkAvailability } from "@/lib/availability";
import { ListingCard } from "./listing-card";
import { FilterPanel } from "./filter-panel";
import { SortDropdown } from "./sort-dropdown";

export const dynamic = "force-dynamic";

const SORT_OPTIONS = [
  { slug: "price_asc", label: "Price: Low to High" },
  { slug: "price_desc", label: "Price: High to Low" },
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

  let orderBy: Prisma.CarListingOrderByWithRelationInput;
  switch (sort) {
    case "price_desc":
      orderBy = { dailyPrice: "desc" };
      break;
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    case "price_asc":
    default:
      orderBy = { dailyPrice: "asc" };
      break;
  }

  // Date-range filter is the only one not expressible directly in Prisma — we
  // need each listing's rules + exceptions + active bookings to call
  // checkAvailability(). Fetch them inline so the in-memory filter pass below
  // doesn't need a second round-trip.
  const listings = await db.carListing.findMany({
    where,
    orderBy,
    include: {
      owner: { select: { fullName: true, status: true } },
      availabilityRules: true,
      exceptions: true,
      bookings: {
        where: {
          status: {
            in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.ONGOING],
          },
        },
        select: { pickupDate: true, returnDate: true, status: true },
      },
    },
  });

  let filteredListings = listings;
  let dateFilterApplied = false;
  if (from && until) {
    const pickup = new Date(`${from}T00:00:00`);
    const ret = new Date(`${until}T00:00:00`);
    if (
      !Number.isNaN(pickup.getTime()) &&
      !Number.isNaN(ret.getTime()) &&
      pickup <= ret
    ) {
      dateFilterApplied = true;
      filteredListings = listings.filter((l) => {
        const result = checkAvailability({
          pickup,
          returnDate: ret,
          rules: l.availabilityRules,
          exceptions: l.exceptions,
          existingBookings: l.bookings,
        });
        return result.ok;
      });
    }
  }

  // Location chips — top distinct locations from active listings (unfiltered
  // by current selection so the user can pivot quickly).
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
                {filteredListings.map((listing) => (
                  <ListingCard
                    fromParam={from || undefined}
                    key={listing.id}
                    listing={listing}
                    untilParam={until || undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
