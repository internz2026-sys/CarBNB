"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { BookingStatus, OwnerStatus } from "@/types";
import { CANCELLATION_REASONS } from "@/lib/cancellation-reasons";
import { writeBookingSystemMessage } from "@/lib/booking-chat-server";
import {
  resolveBookingAuthority,
  type BookingAuthority,
} from "@/lib/host-booking-authority";
import { format } from "date-fns";

export type HostBookingActionState =
  | {
      error: string;
      fieldErrors?: Record<string, string[] | undefined>;
    }
  | null;

// VERIFIED hosts only — PENDING / SUSPENDED hosts cannot act on bookings
// against their cars. Page-level redirects also enforce this, but the
// action is the real trust boundary.
async function requireHost() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("Not authenticated");
  const owner = await db.owner.findUnique({ where: { email: user.email } });
  if (!owner) throw new Error("Not authorized");
  if (owner.status !== OwnerStatus.VERIFIED) {
    throw new Error("Host account must be verified before acting on bookings.");
  }
  return owner;
}

type ActorContext = {
  actorKind: "owner-direct" | "fleet";
  actorLabel: string; // "Host" or "Fleet" — used in activity-log + system-msg copy
  actorDisplayName: string; // e.g. "Joe" or "Acme Rentals" — used for system messages
  actorEmail: string;
  booking: BookingAuthority extends infer A
    ? A extends { booking: infer B }
      ? B
      : never
    : never;
};

// Resolves the authority and rejects callers without action rights.
// "owner-managed" callers (individual owner on a fleet-managed car) are
// rejected — the fleet has exclusive operational control once a link is
// ACTIVE.
async function requireBookingActor(
  bookingId: string,
  owner: { id: string; email: string; fullName: string; companyName: string | null; kind: string },
): Promise<{ error: string } | ActorContext> {
  const authority = await resolveBookingAuthority(bookingId, owner.id);
  if (authority.kind === "none") {
    return { error: "You cannot act on bookings you don't own." };
  }
  if (authority.kind === "owner-managed") {
    return {
      error: `This booking is managed by ${authority.fleet.displayName}. They control confirm / start / complete actions.`,
    };
  }

  if (authority.kind === "fleet") {
    return {
      actorKind: "fleet",
      actorLabel: "Fleet",
      actorDisplayName: owner.companyName ?? owner.fullName,
      actorEmail: owner.email,
      booking: authority.booking,
    };
  }

  // owner-direct
  return {
    actorKind: "owner-direct",
    actorLabel: "Host",
    actorDisplayName: owner.fullName,
    actorEmail: owner.email,
    booking: authority.booking,
  };
}

function activityActionFor(
  actor: ActorContext,
  verb: "CONFIRMED" | "STARTED" | "COMPLETED" | "REJECTED",
): string {
  return `${actor.actorKind === "fleet" ? "FLEET" : "HOST"}_BOOKING_${verb}`;
}

// ─────────────────────────────────────────────────────────────────────────
// Confirm — PENDING → CONFIRMED (host accepts the incoming request).
// ─────────────────────────────────────────────────────────────────────────

export async function hostConfirmBookingAction(
  _prev: HostBookingActionState,
  formData: FormData,
): Promise<HostBookingActionState> {
  const host = await requireHost();

  const bookingId = String(formData.get("bookingId") ?? "").trim();
  if (!bookingId) return { error: "Missing booking id." };

  const scope = await requireBookingActor(bookingId, host);
  if ("error" in scope) return { error: scope.error };
  const booking = scope.booking;

  if (booking.status !== BookingStatus.PENDING) {
    return {
      error: `Only pending bookings can be confirmed. This one is "${booking.status}".`,
    };
  }

  await db.booking.update({
    where: { id: bookingId },
    data: { status: BookingStatus.CONFIRMED },
  });

  // Tier 14: a CONFIRMED booking opens the chat. Write the welcome
  // system message so both parties land into a populated thread, not a
  // blank one. Tier 16: actor wording switches to "fleet" when the
  // booking is fleet-managed.
  const byLabel = scope.actorKind === "fleet" ? scope.actorDisplayName : "host";
  await writeBookingSystemMessage(
    bookingId,
    `Booking confirmed by ${byLabel}. Use this chat to coordinate pickup, drop-off, and trip needs.`,
  );

  await db.activityLogEntry.create({
    data: {
      action: activityActionFor(scope, "CONFIRMED"),
      description: `${scope.actorLabel} ${scope.actorEmail} confirmed booking ${booking.referenceNumber} for ${booking.customerName}`,
      type: "booking",
    },
  });

  revalidatePath("/host/bookings");
  revalidatePath(`/host/bookings/${bookingId}`);
  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`);
  return null;
}

// ─────────────────────────────────────────────────────────────────────────
// Trip lifecycle — Start (CONFIRMED → ONGOING) and Complete (ONGOING →
// COMPLETED). Mirrors admin's startRentalAction / completeRentalAction with
// ownership scope. Both host and admin can transition; first-mover wins via
// the existing status guard. The host has direct ground truth (handed over
// the keys, got the car back), so giving them this control reduces the lag
// where admin-as-bureaucrat was transcribing what the host already knew.
// ─────────────────────────────────────────────────────────────────────────

export async function hostStartRentalAction(
  _prev: HostBookingActionState,
  formData: FormData,
): Promise<HostBookingActionState> {
  const host = await requireHost();

  const bookingId = String(formData.get("bookingId") ?? "").trim();
  if (!bookingId) return { error: "Missing booking id." };

  const scope = await requireBookingActor(bookingId, host);
  if ("error" in scope) return { error: scope.error };
  const booking = scope.booking;

  if (booking.status !== BookingStatus.CONFIRMED) {
    return {
      error: `Only confirmed bookings can be started. This one is "${booking.status}".`,
    };
  }

  const startedAt = new Date();
  await db.booking.update({
    where: { id: bookingId },
    data: {
      status: BookingStatus.ONGOING,
      rentalStartedAt: startedAt,
    },
  });

  const byLabel = scope.actorKind === "fleet" ? scope.actorDisplayName : "host";
  await writeBookingSystemMessage(
    bookingId,
    `Trip started by ${byLabel} · ${format(startedAt, "MMM d, h:mm a")}`,
  );

  await db.activityLogEntry.create({
    data: {
      action: activityActionFor(scope, "STARTED"),
      description: `${scope.actorLabel} ${scope.actorEmail} started rental for booking ${booking.referenceNumber} (${booking.carName})`,
      type: "booking",
    },
  });

  revalidatePath("/host/bookings");
  revalidatePath(`/host/bookings/${bookingId}`);
  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/account");
  revalidatePath(`/account/bookings/${bookingId}`);
  return null;
}

export async function hostCompleteRentalAction(
  _prev: HostBookingActionState,
  formData: FormData,
): Promise<HostBookingActionState> {
  const host = await requireHost();

  const bookingId = String(formData.get("bookingId") ?? "").trim();
  if (!bookingId) return { error: "Missing booking id." };

  const scope = await requireBookingActor(bookingId, host);
  if ("error" in scope) return { error: scope.error };
  const booking = scope.booking;

  if (booking.status !== BookingStatus.ONGOING) {
    return {
      error: `Only ongoing bookings can be completed. This one is "${booking.status}".`,
    };
  }

  const completedAt = new Date();
  await db.booking.update({
    where: { id: bookingId },
    data: {
      status: BookingStatus.COMPLETED,
      rentalCompletedAt: completedAt,
    },
  });

  const byLabel = scope.actorKind === "fleet" ? scope.actorDisplayName : "host";
  await writeBookingSystemMessage(
    bookingId,
    `Trip completed by ${byLabel} · ${format(completedAt, "MMM d, h:mm a")}. Chat closes in 48h.`,
  );

  await db.activityLogEntry.create({
    data: {
      action: activityActionFor(scope, "COMPLETED"),
      description: `${scope.actorLabel} ${scope.actorEmail} completed rental for booking ${booking.referenceNumber} (${booking.carName})`,
      type: "booking",
    },
  });

  revalidatePath("/host/bookings");
  revalidatePath(`/host/bookings/${bookingId}`);
  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/account");
  revalidatePath(`/account/bookings/${bookingId}`);
  return null;
}

// ─────────────────────────────────────────────────────────────────────────
// Reject — PENDING → REJECTED with reason (same slug set as admin cancel).
// ─────────────────────────────────────────────────────────────────────────

const RejectSchema = z
  .object({
    reason: z.string().trim().min(1, "Please pick a reason."),
    note: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .superRefine((val, ctx) => {
    const valid = CANCELLATION_REASONS.some((r) => r.slug === val.reason);
    if (!valid) {
      ctx.addIssue({ code: "custom", path: ["reason"], message: "Unknown reason." });
    }
    if (val.reason === "other" && !val.note?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["note"],
        message: "Please describe the reason when selecting Other.",
      });
    }
  });

export async function hostRejectBookingAction(
  _prev: HostBookingActionState,
  formData: FormData,
): Promise<HostBookingActionState> {
  const host = await requireHost();

  const bookingId = String(formData.get("bookingId") ?? "").trim();
  if (!bookingId) return { error: "Missing booking id." };

  const parsed = RejectSchema.safeParse({
    reason: formData.get("reason"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const scope = await requireBookingActor(bookingId, host);
  if ("error" in scope) return { error: scope.error };
  const booking = scope.booking;

  if (booking.status !== BookingStatus.PENDING) {
    return {
      error: `Only pending bookings can be rejected. This one is "${booking.status}".`,
    };
  }

  await db.booking.update({
    where: { id: bookingId },
    data: {
      status: BookingStatus.REJECTED,
      cancellationReason: parsed.data.reason,
      cancellationNote: parsed.data.note?.trim() || null,
      cancelledAt: new Date(),
      cancelledBy: scope.actorEmail,
    },
  });

  await db.activityLogEntry.create({
    data: {
      action: activityActionFor(scope, "REJECTED"),
      description: `${scope.actorLabel} ${scope.actorEmail} rejected booking ${booking.referenceNumber} (${parsed.data.reason})`,
      type: "booking",
    },
  });

  revalidatePath("/host/bookings");
  revalidatePath(`/host/bookings/${bookingId}`);
  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`);
  return null;
}
