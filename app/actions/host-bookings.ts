"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { BookingStatus, OwnerStatus } from "@/types";
import { CANCELLATION_REASONS } from "@/lib/cancellation-reasons";
import { writeBookingSystemMessage } from "@/lib/booking-chat-server";
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

type BookingRow = NonNullable<Awaited<ReturnType<typeof db.booking.findUnique>>>;

async function requireOwnBooking(
  bookingId: string,
  ownerId: string,
): Promise<{ error: string } | { booking: BookingRow }> {
  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return { error: "Booking not found." };
  if (booking.ownerId !== ownerId) {
    return { error: "You cannot act on bookings you don't own." };
  }
  return { booking };
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

  const scope = await requireOwnBooking(bookingId, host.id);
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
  // blank one.
  await writeBookingSystemMessage(
    bookingId,
    "Booking confirmed by host. Use this chat to coordinate pickup, drop-off, and trip needs.",
  );

  await db.activityLogEntry.create({
    data: {
      action: "HOST_BOOKING_CONFIRMED",
      description: `Host ${host.email} confirmed booking ${booking.referenceNumber} for ${booking.customerName}`,
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

  const scope = await requireOwnBooking(bookingId, host.id);
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

  await writeBookingSystemMessage(
    bookingId,
    `Trip started by host · ${format(startedAt, "MMM d, h:mm a")}`,
  );

  await db.activityLogEntry.create({
    data: {
      action: "HOST_BOOKING_STARTED",
      description: `Host ${host.email} started rental for booking ${booking.referenceNumber} (${booking.carName})`,
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

  const scope = await requireOwnBooking(bookingId, host.id);
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

  await writeBookingSystemMessage(
    bookingId,
    `Trip completed by host · ${format(completedAt, "MMM d, h:mm a")}. Chat closes in 48h.`,
  );

  await db.activityLogEntry.create({
    data: {
      action: "HOST_BOOKING_COMPLETED",
      description: `Host ${host.email} completed rental for booking ${booking.referenceNumber} (${booking.carName})`,
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

  const scope = await requireOwnBooking(bookingId, host.id);
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
      cancelledBy: host.email,
    },
  });

  await db.activityLogEntry.create({
    data: {
      action: "HOST_BOOKING_REJECTED",
      description: `Host ${host.email} rejected booking ${booking.referenceNumber} (${parsed.data.reason})`,
      type: "booking",
    },
  });

  revalidatePath("/host/bookings");
  revalidatePath(`/host/bookings/${bookingId}`);
  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`);
  return null;
}
