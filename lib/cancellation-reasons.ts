// Shared source of truth for booking cancellation/rejection reasons.
// Lives outside `"use server"` files because Next.js rejects non-function
// exports from server-action modules. Importable from both server actions
// and client components.
export const CANCELLATION_REASONS = [
  { slug: "customer_no_show", label: "Customer no-show" },
  { slug: "documents_not_verified", label: "Documents not verified" },
  { slug: "vehicle_unavailable", label: "Vehicle unavailable" },
  { slug: "duplicate_booking", label: "Duplicate booking" },
  { slug: "other", label: "Other" },
] as const;

export const CANCELLATION_SLUGS = CANCELLATION_REASONS.map((r) => r.slug) as [
  string,
  ...string[],
];
