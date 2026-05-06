"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { OwnerStatus } from "@/types";

export type FleetLinkActionState =
  | { error: string; fieldErrors?: Record<string, string[] | undefined> }
  | { ok: true }
  | null;

// Tier 15 fleet-link actions:
// - requestLinkAction: independent owner sends a link request for one of
//   their cars to a verified fleet operator
// - cancelLinkRequestAction: owner withdraws a still-pending request
// - severLinkAction: either side ends an ACTIVE link (status → INACTIVE)
// - approveLinkAction / rejectLinkAction: fleet responds to a pending
//   request from their host dashboard
//
// All routes guard at the action layer first (auth + ownership), even
// though page-level guards usually catch most attempts. The action is
// the real trust boundary.

async function requireOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("Not authenticated");
  const owner = await db.owner.findUnique({ where: { email: user.email } });
  if (!owner) throw new Error("Not authorized");
  return owner;
}

// ─────────────────────────────────────────────────────────────────────────
// Owner-initiated request
// ─────────────────────────────────────────────────────────────────────────

const RequestSchema = z.object({
  listingId: z.string().trim().min(1, "Missing listing id"),
  fleetId: z.string().trim().min(1, "Pick a fleet operator"),
  managementFeePercent: z.coerce
    .number()
    .min(0, "Fee must be 0 or higher")
    .max(100, "Fee must be 100 or lower")
    .optional(),
});

export async function requestLinkAction(
  _prev: FleetLinkActionState,
  formData: FormData,
): Promise<FleetLinkActionState> {
  let owner: Awaited<ReturnType<typeof requireOwner>>;
  try {
    owner = await requireOwner();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Auth required." };
  }

  // Tier 15 design: only INDIVIDUAL owners can request a fleet to manage
  // their car. A FLEET requesting another fleet to manage their cars
  // doesn't fit the model (and would create chains).
  if (owner.kind !== "INDIVIDUAL") {
    return { error: "Only independent car owners can request fleet management." };
  }

  const parsed = RequestSchema.safeParse({
    listingId: formData.get("listingId"),
    fleetId: formData.get("fleetId"),
    managementFeePercent: formData.get("managementFeePercent"),
  });
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Listing must belong to this owner.
  const listing = await db.carListing.findUnique({
    where: { id: parsed.data.listingId },
    select: { id: true, ownerId: true, brand: true, model: true, plateNumber: true },
  });
  if (!listing) return { error: "Listing not found." };
  if (listing.ownerId !== owner.id) {
    return { error: "You can only request a fleet for your own cars." };
  }

  // Fleet must exist and be a VERIFIED FLEET.
  const fleet = await db.owner.findUnique({
    where: { id: parsed.data.fleetId },
    select: { id: true, kind: true, status: true, companyName: true, fullName: true },
  });
  if (!fleet || fleet.kind !== "FLEET") {
    return { error: "Selected operator is not a registered fleet." };
  }
  if (fleet.status !== OwnerStatus.VERIFIED) {
    return { error: "Selected fleet operator is not verified yet." };
  }

  // Don't allow stacking a new request when there's an open one (PENDING
  // or ACTIVE) for this same listing. If owner wants to switch fleets,
  // they need to sever the existing link first.
  const blocking = await db.fleetCarLink.findFirst({
    where: {
      listingId: listing.id,
      status: { in: ["PENDING", "ACTIVE"] },
    },
  });
  if (blocking) {
    return {
      error:
        blocking.status === "PENDING"
          ? "You already have a pending request for this car."
          : "This car is already managed by a fleet. Sever the active link first.",
    };
  }

  await db.fleetCarLink.create({
    data: {
      listingId: listing.id,
      fleetId: fleet.id,
      status: "PENDING",
      managementFeePercent: parsed.data.managementFeePercent ?? null,
    },
  });

  await db.activityLogEntry.create({
    data: {
      action: "FLEET_LINK_REQUESTED",
      description: `Owner ${owner.email} requested ${fleet.companyName ?? fleet.fullName} to manage ${listing.brand} ${listing.model} (${listing.plateNumber})`,
      type: "owner",
    },
  });

  revalidatePath(`/host/cars/${listing.id}/edit`);
  revalidatePath("/host/dashboard");
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────
// Owner cancels their still-pending request
// ─────────────────────────────────────────────────────────────────────────

export async function cancelLinkRequestAction(
  _prev: FleetLinkActionState,
  formData: FormData,
): Promise<FleetLinkActionState> {
  let owner: Awaited<ReturnType<typeof requireOwner>>;
  try {
    owner = await requireOwner();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Auth required." };
  }

  const linkId = String(formData.get("linkId") ?? "").trim();
  if (!linkId) return { error: "Missing link id." };

  const link = await db.fleetCarLink.findUnique({
    where: { id: linkId },
    include: { listing: { select: { ownerId: true, brand: true, model: true } } },
  });
  if (!link) return { error: "Link not found." };
  if (link.listing.ownerId !== owner.id) {
    return { error: "You can only cancel requests for your own cars." };
  }
  if (link.status !== "PENDING") {
    return {
      error: `Cannot cancel a link that's "${link.status}". Use sever instead.`,
    };
  }

  await db.fleetCarLink.update({
    where: { id: linkId },
    data: { status: "INACTIVE", severedAt: new Date() },
  });

  await db.activityLogEntry.create({
    data: {
      action: "FLEET_LINK_CANCELLED",
      description: `Owner ${owner.email} cancelled their pending fleet request for ${link.listing.brand} ${link.listing.model}`,
      type: "owner",
    },
  });

  revalidatePath(`/host/cars/${link.listingId}/edit`);
  revalidatePath("/host/dashboard");
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────
// Sever an ACTIVE link — either side can do this
// ─────────────────────────────────────────────────────────────────────────

export async function severLinkAction(
  _prev: FleetLinkActionState,
  formData: FormData,
): Promise<FleetLinkActionState> {
  let owner: Awaited<ReturnType<typeof requireOwner>>;
  try {
    owner = await requireOwner();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Auth required." };
  }

  const linkId = String(formData.get("linkId") ?? "").trim();
  if (!linkId) return { error: "Missing link id." };

  const link = await db.fleetCarLink.findUnique({
    where: { id: linkId },
    include: {
      listing: { select: { ownerId: true, brand: true, model: true } },
      fleet: { select: { id: true, companyName: true, fullName: true } },
    },
  });
  if (!link) return { error: "Link not found." };

  // Either the listing's owner OR the fleet itself can sever.
  const isOwner = link.listing.ownerId === owner.id;
  const isFleet = link.fleetId === owner.id;
  if (!isOwner && !isFleet) {
    return { error: "Only the car's owner or the managing fleet can sever this link." };
  }

  if (link.status !== "ACTIVE") {
    return {
      error: `Cannot sever a link that's "${link.status}".`,
    };
  }

  await db.fleetCarLink.update({
    where: { id: linkId },
    data: { status: "INACTIVE", severedAt: new Date() },
  });

  await db.activityLogEntry.create({
    data: {
      action: "FLEET_LINK_SEVERED",
      description: `${isOwner ? "Owner" : "Fleet"} ${owner.email} severed the link between ${link.fleet.companyName ?? link.fleet.fullName} and ${link.listing.brand} ${link.listing.model}`,
      type: "owner",
    },
  });

  revalidatePath(`/host/cars/${link.listingId}/edit`);
  revalidatePath("/host/dashboard");
  revalidatePath("/host/cars");
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────
// Fleet approves a pending request
// ─────────────────────────────────────────────────────────────────────────

export async function approveLinkAction(
  _prev: FleetLinkActionState,
  formData: FormData,
): Promise<FleetLinkActionState> {
  let fleet: Awaited<ReturnType<typeof requireOwner>>;
  try {
    fleet = await requireOwner();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Auth required." };
  }

  if (fleet.kind !== "FLEET") {
    return { error: "Only fleet operators can approve link requests." };
  }
  if (fleet.status !== OwnerStatus.VERIFIED) {
    return { error: "Your fleet account must be verified before approving requests." };
  }

  const linkId = String(formData.get("linkId") ?? "").trim();
  if (!linkId) return { error: "Missing link id." };

  const link = await db.fleetCarLink.findUnique({
    where: { id: linkId },
    include: { listing: { select: { id: true, brand: true, model: true } } },
  });
  if (!link) return { error: "Link not found." };
  if (link.fleetId !== fleet.id) {
    return { error: "This request isn't for your fleet." };
  }
  if (link.status !== "PENDING") {
    return {
      error: `Cannot approve a request that's "${link.status}".`,
    };
  }

  // Application-level enforcement: only one ACTIVE link per listing.
  const conflict = await db.fleetCarLink.findFirst({
    where: { listingId: link.listingId, status: "ACTIVE" },
  });
  if (conflict) {
    return { error: "This car already has an active fleet link with another operator." };
  }

  await db.fleetCarLink.update({
    where: { id: linkId },
    data: { status: "ACTIVE", respondedAt: new Date() },
  });

  await db.activityLogEntry.create({
    data: {
      action: "FLEET_LINK_APPROVED",
      description: `Fleet ${fleet.email} (${fleet.companyName ?? fleet.fullName}) approved managing ${link.listing.brand} ${link.listing.model}`,
      type: "owner",
    },
  });

  revalidatePath("/host/dashboard");
  revalidatePath("/host/cars");
  revalidatePath(`/host/cars/${link.listingId}/edit`);
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────
// Fleet rejects a pending request
// ─────────────────────────────────────────────────────────────────────────

export async function rejectLinkAction(
  _prev: FleetLinkActionState,
  formData: FormData,
): Promise<FleetLinkActionState> {
  let fleet: Awaited<ReturnType<typeof requireOwner>>;
  try {
    fleet = await requireOwner();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Auth required." };
  }

  if (fleet.kind !== "FLEET") {
    return { error: "Only fleet operators can reject link requests." };
  }

  const linkId = String(formData.get("linkId") ?? "").trim();
  if (!linkId) return { error: "Missing link id." };

  const link = await db.fleetCarLink.findUnique({
    where: { id: linkId },
    include: { listing: { select: { brand: true, model: true } } },
  });
  if (!link) return { error: "Link not found." };
  if (link.fleetId !== fleet.id) {
    return { error: "This request isn't for your fleet." };
  }
  if (link.status !== "PENDING") {
    return {
      error: `Cannot reject a request that's "${link.status}".`,
    };
  }

  await db.fleetCarLink.update({
    where: { id: linkId },
    data: { status: "INACTIVE", respondedAt: new Date(), severedAt: new Date() },
  });

  await db.activityLogEntry.create({
    data: {
      action: "FLEET_LINK_REJECTED",
      description: `Fleet ${fleet.email} (${fleet.companyName ?? fleet.fullName}) rejected the request to manage ${link.listing.brand} ${link.listing.model}`,
      type: "owner",
    },
  });

  revalidatePath("/host/dashboard");
  revalidatePath(`/host/cars/${link.listingId}/edit`);
  return { ok: true };
}
