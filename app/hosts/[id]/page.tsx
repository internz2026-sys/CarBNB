import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { MapPin, ShieldCheck } from "lucide-react";

import { db } from "@/lib/db";
import { ListingStatus, OwnerStatus } from "@/types";
import { getCurrentViewer } from "@/lib/current-user";
import { UserMenu } from "@/components/layout/user-menu";
import { ListingCard } from "@/app/listings/listing-card";

export const dynamic = "force-dynamic";

type HostProfilePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: HostProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const owner = await db.owner.findUnique({
    where: { id },
    select: { fullName: true, status: true, kind: true, companyName: true },
  });
  if (!owner || owner.status !== OwnerStatus.VERIFIED) {
    return { title: "Host Not Found | DriveXP" };
  }
  const displayName =
    owner.kind === "FLEET" && owner.companyName ? owner.companyName : owner.fullName;
  const kindLabel = owner.kind === "FLEET" ? "Fleet Operator" : "Host";
  return {
    title: `${displayName} | DriveXP ${kindLabel}`,
    description: `Browse cars ${owner.kind === "FLEET" ? "managed" : "hosted"} by ${displayName} on DriveXP.`,
  };
}

function getOwnerInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default async function HostProfilePage({ params }: HostProfilePageProps) {
  const { id } = await params;

  const owner = await db.owner.findUnique({ where: { id } });

  // Don't expose pending or suspended hosts publicly — those listings
  // wouldn't be browsable anyway, so the profile page would mislead.
  if (!owner || owner.status !== OwnerStatus.VERIFIED) {
    notFound();
  }

  const isFleet = owner.kind === "FLEET";

  // Listings query depends on kind:
  // - INDIVIDUAL: just cars they own
  // - FLEET: cars they own + cars linked to them via ACTIVE FleetCarLink
  // Both restricted to ACTIVE listing status. (Tier 15)
  const listingsInclude = {
    owner: { select: { status: true } },
    fleetLinks: {
      where: { status: "ACTIVE" },
      take: 1,
      select: {
        fleet: { select: { id: true, companyName: true, fullName: true } },
      },
    },
  } as const;

  const listings = isFleet
    ? await db.carListing.findMany({
        where: {
          status: ListingStatus.ACTIVE,
          OR: [
            { ownerId: id },
            { fleetLinks: { some: { fleetId: id, status: "ACTIVE" } } },
          ],
        },
        orderBy: { createdAt: "desc" },
        include: listingsInclude,
      })
    : await db.carListing.findMany({
        where: { ownerId: id, status: ListingStatus.ACTIVE },
        orderBy: { createdAt: "desc" },
        include: listingsInclude,
      });

  const viewer = await getCurrentViewer();

  // Tier 11: load the customer's favorited set so the cards on the host
  // profile heart-state correctly. No-op for non-customers.
  const favoritedIds = new Set<string>();
  if (viewer.kind === "customer") {
    const favs = await db.favorite.findMany({
      where: { customerId: viewer.id },
      select: { listingId: true },
    });
    for (const f of favs) favoritedIds.add(f.listingId);
  }

  const displayName = isFleet && owner.companyName ? owner.companyName : owner.fullName;

  return (
    <div className="min-h-screen bg-surface pb-20 font-sans">
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

      <section className="mx-auto max-w-5xl px-4 pt-10 sm:px-6">
        <div className="mb-8 rounded-[1.5rem] bg-surface-container-lowest p-6 shadow-[0_10px_28px_rgb(19_27_46_/_0.04)] sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative shrink-0">
              <div className="grid size-20 place-items-center rounded-full bg-[linear-gradient(135deg,var(--color-primary-fixed)_0%,var(--color-secondary-container)_100%)] text-xl font-bold text-primary shadow-[0_8px_24px_rgb(19_27_46_/_0.06)]">
                {getOwnerInitials(displayName)}
              </div>
              <div className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full bg-tertiary text-white ring-2 ring-surface-container-lowest">
                <ShieldCheck className="size-4" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                {isFleet ? "Verified Fleet Operator" : "Verified Host"}
              </p>
              <h1 className="mt-1 font-headline text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl">
                {displayName}
              </h1>
              {isFleet && owner.serviceArea ? (
                <p className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  <MapPin className="size-4" />
                  {owner.serviceArea}
                </p>
              ) : null}
              <p className="mt-2 text-sm text-on-surface-variant">
                Member since {format(owner.createdAt, "MMMM yyyy")}
                {isFleet ? " · Operator account" : ""}
              </p>
            </div>
          </div>

          {owner.bio ? (
            <div className="mt-6 border-t border-border pt-6">
              {isFleet ? (
                <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  About this company
                </h2>
              ) : null}
              <p className="whitespace-pre-wrap text-sm leading-7 text-on-surface-variant">
                {owner.bio}
              </p>
            </div>
          ) : null}
        </div>

        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            {isFleet ? "Cars under management" : "Listings"} ({listings.length})
          </h2>
        </div>

        {listings.length === 0 ? (
          <div className="rounded-2xl bg-surface-container-low p-12 text-center">
            <p className="text-lg font-semibold text-on-surface">
              No active listings right now
            </p>
            <p className="mt-2 text-sm text-on-surface-variant">
              {(isFleet && owner.companyName ? owner.companyName : owner.fullName.split(" ")[0])} doesn&apos;t have any cars available at the moment. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => {
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
                  isFavorited={favoritedIds.has(listing.id)}
                  key={listing.id}
                  listing={{ ...listing, activeFleet }}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
