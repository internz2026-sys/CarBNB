import "server-only";
import { db } from "@/lib/db";

// Tier 16 — booking authority resolver. Used by both the action layer
// (host-bookings.ts) and the booking-detail page guard. Centralizes the
// rule "who is allowed to act on this booking?" so we don't drift across
// surfaces.
//
// Possible outcomes for a logged-in owner viewing a given booking:
//   - "owner-direct": owner is the booking's listing owner AND no
//     ACTIVE FleetCarLink exists on this car. Action buttons render;
//     individual is the chat counterparty.
//   - "owner-managed": owner is the booking's listing owner BUT an
//     ACTIVE FleetCarLink delegates operational control to a fleet.
//     Individual sees the booking informational, chat is read-only.
//   - "fleet": owner is a FLEET with an ACTIVE link on this car (and
//     therefore is NOT booking.ownerId — that's still the individual).
//     Action buttons render; fleet is the chat counterparty.
//   - "none": owner has no relationship to this booking. Page → notFound.

export type BookingAuthority =
  | { kind: "owner-direct"; booking: BookingForAuthority }
  | {
      kind: "owner-managed";
      booking: BookingForAuthority;
      fleet: { id: string; displayName: string };
    }
  | {
      kind: "fleet";
      booking: BookingForAuthority;
      fleet: { id: string; displayName: string };
    }
  | { kind: "none" };

export type BookingForAuthority = NonNullable<
  Awaited<ReturnType<typeof loadBookingWithFleet>>
>;

async function loadBookingWithFleet(bookingId: string) {
  return db.booking.findUnique({
    where: { id: bookingId },
    include: {
      carListing: {
        select: {
          id: true,
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
      },
    },
  });
}

export async function resolveBookingAuthority(
  bookingId: string,
  ownerId: string,
): Promise<BookingAuthority> {
  const booking = await loadBookingWithFleet(bookingId);
  if (!booking) return { kind: "none" };

  const activeLink = booking.carListing.fleetLinks[0];
  const fleetInfo = activeLink
    ? {
        id: activeLink.fleet.id,
        displayName: activeLink.fleet.companyName ?? activeLink.fleet.fullName,
      }
    : null;

  if (booking.ownerId === ownerId) {
    if (fleetInfo) {
      return { kind: "owner-managed", booking, fleet: fleetInfo };
    }
    return { kind: "owner-direct", booking };
  }

  if (activeLink && activeLink.fleetId === ownerId) {
    return { kind: "fleet", booking, fleet: fleetInfo! };
  }

  return { kind: "none" };
}
