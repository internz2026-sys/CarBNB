import "server-only";
import type { Prisma } from "@prisma/client";
import { OwnerStatus } from "@/types";

// Tier 19 — required-doc matrix per host kind. Encodes cross-cutting decision
// #7: INDIVIDUAL hosts need ID + license; FLEET hosts need ID + business
// registration document (skip license since the contact person isn't
// driving). Used in two places:
//   1. Admin verification queue / dashboard tile — filter to "PENDING owners
//      with all required docs uploaded" so admins don't see half-finished
//      profiles. Treats doc presence as the implicit "Submit for Review"
//      signal (no separate column needed).
//   2. Host /host/profile — derive the "documents complete" banner state
//      and the post-upload-review messaging.

// Prisma WHERE clause for the admin verification queue.
export const PENDING_OWNER_WITH_DOCS_WHERE: Prisma.OwnerWhereInput = {
  status: OwnerStatus.PENDING,
  idDocumentUrl: { not: null },
  OR: [
    { kind: "INDIVIDUAL", licenseDocumentUrl: { not: null } },
    { kind: "FLEET", businessRegistrationDocumentUrl: { not: null } },
  ],
};

// In-memory predicate for cases where rows are already loaded — avoids a
// round trip just to recompute what we already have on hand.
export function hasAllRequiredHostDocs(owner: {
  kind: string;
  idDocumentUrl: string | null;
  licenseDocumentUrl: string | null;
  businessRegistrationDocumentUrl: string | null;
}): boolean {
  if (!owner.idDocumentUrl) return false;
  if (owner.kind === "FLEET") {
    return Boolean(owner.businessRegistrationDocumentUrl);
  }
  return Boolean(owner.licenseDocumentUrl);
}
