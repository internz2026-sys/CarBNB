// Tier 20 — central registry of notification type strings. Used by the
// notify() helper, the <NotificationBell> dropdown for icon/styling,
// and the /notifications archive page for filtering.
// Keep this list in sync with the trigger points listed in BACKLOG.md
// Tier 20 design + MANUAL-TESTING.md T20-A through T20-F.

export const NotificationType = {
  // Booking lifecycle
  BOOKING_CREATED: "BOOKING_CREATED",          // → host + admin (and fleet operator if FleetCarLink ACTIVE)
  BOOKING_CONFIRMED: "BOOKING_CONFIRMED",      // → customer
  BOOKING_REJECTED: "BOOKING_REJECTED",        // → customer
  BOOKING_CANCELLED: "BOOKING_CANCELLED",      // → the other party (or all parties if admin-initiated)

  // Owner verification (admin → host)
  OWNER_VERIFIED: "OWNER_VERIFIED",            // → host
  OWNER_SUSPENDED: "OWNER_SUSPENDED",          // → host

  // Listing approval (admin → host)
  LISTING_APPROVED: "LISTING_APPROVED",        // → host
  LISTING_REJECTED: "LISTING_REJECTED",        // → host

  // Customer verification (admin → customer) — Tier 19 events
  CUSTOMER_VERIFIED: "CUSTOMER_VERIFIED",      // → customer
  CUSTOMER_REJECTED: "CUSTOMER_REJECTED",      // → customer

  // Reviews (Tier 10)
  REVIEW_POSTED: "REVIEW_POSTED",              // → host

  // Tier 21+ trigger point (parked) — not used in Tier 20:
  // FLEET_LINK_REQUESTED: "FLEET_LINK_REQUESTED",
  // FLEET_LINK_APPROVED: "FLEET_LINK_APPROVED",
  // FLEET_LINK_REJECTED: "FLEET_LINK_REJECTED",
} as const;

export type NotificationTypeKey = keyof typeof NotificationType;
export type NotificationTypeValue = (typeof NotificationType)[NotificationTypeKey];

// Roles the bell + archive page can be shown to. Mirrors the existing
// route-group split (admin / host / customer).
export type NotificationRole = "admin" | "host" | "customer";
