import "server-only";
import { db } from "@/lib/db";

// Tier 16 — listing authority resolver. Mirrors host-booking-authority,
// but for the listing-edit surface (`/host/cars/[id]/edit`) and the
// availability-related server actions. After Tier 16, both the
// individual owner AND a fleet operator with an ACTIVE link can edit
// availability rules + exceptions for the same car.

export type ListingAuthority =
  | { kind: "owner-direct"; listing: ListingForAuthority }
  | {
      kind: "fleet";
      listing: ListingForAuthority;
      fleet: { id: string; displayName: string };
    }
  | { kind: "none" };

export type ListingForAuthority = NonNullable<
  Awaited<ReturnType<typeof loadListingWithFleet>>
>;

async function loadListingWithFleet(listingId: string) {
  return db.carListing.findUnique({
    where: { id: listingId },
    include: {
      fleetLinks: {
        where: { status: "ACTIVE" },
        select: {
          fleetId: true,
          fleet: {
            select: { id: true, companyName: true, fullName: true },
          },
        },
        take: 1,
      },
    },
  });
}

export async function resolveListingAuthority(
  listingId: string,
  ownerId: string,
): Promise<ListingAuthority> {
  const listing = await loadListingWithFleet(listingId);
  if (!listing) return { kind: "none" };

  if (listing.ownerId === ownerId) {
    return { kind: "owner-direct", listing };
  }

  const activeLink = listing.fleetLinks[0];
  if (activeLink && activeLink.fleetId === ownerId) {
    return {
      kind: "fleet",
      listing,
      fleet: {
        id: activeLink.fleet.id,
        displayName:
          activeLink.fleet.companyName ?? activeLink.fleet.fullName,
      },
    };
  }

  return { kind: "none" };
}
