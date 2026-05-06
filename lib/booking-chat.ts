import { BookingStatus } from "@/types";

// Hours of post-completion access. After this window, the chat goes
// read-only — message history stays visible, no new sends from either
// party. Locked Tier 14 decision (BACKLOG.md decisions table).
export const CHAT_GRACE_HOURS = 48;

export const MESSAGE_BODY_MAX = 1000;

type BookingShape = {
  status: string;
  rentalCompletedAt: Date | null;
};

export type ChatState =
  | { kind: "active"; gracePeriodEnd: Date | null }
  | { kind: "not-yet" }            // PENDING / not yet a booking
  | { kind: "closed-grace-expired"; closedAt: Date }
  | { kind: "closed-cancelled" };  // CANCELLED / REJECTED — chat frozen at the moment of transition

// Single source of truth for "can the chat accept new messages right now?"
// Used both server-side (sendMessageAction guard) and client-side (input
// shows / hides). Pure function — no DB access — so it's safe to import
// from both server and client modules.
export function getChatState(booking: BookingShape, now: Date = new Date()): ChatState {
  if (
    booking.status === BookingStatus.PENDING
  ) {
    return { kind: "not-yet" };
  }

  if (
    booking.status === BookingStatus.CANCELLED ||
    booking.status === BookingStatus.REJECTED
  ) {
    return { kind: "closed-cancelled" };
  }

  if (
    booking.status === BookingStatus.CONFIRMED ||
    booking.status === BookingStatus.ONGOING
  ) {
    return { kind: "active", gracePeriodEnd: null };
  }

  // COMPLETED — gated by grace window.
  if (booking.status === BookingStatus.COMPLETED) {
    if (!booking.rentalCompletedAt) {
      // Defensive: COMPLETED without a rentalCompletedAt is malformed
      // (the transition actions always set it). Fall back to "active"
      // so users aren't accidentally locked out.
      return { kind: "active", gracePeriodEnd: null };
    }
    const closesAt = new Date(
      booking.rentalCompletedAt.getTime() + CHAT_GRACE_HOURS * 60 * 60 * 1000,
    );
    if (now < closesAt) {
      return { kind: "active", gracePeriodEnd: closesAt };
    }
    return { kind: "closed-grace-expired", closedAt: closesAt };
  }

  // Unknown status — be permissive. Better to show the chat than break it.
  return { kind: "active", gracePeriodEnd: null };
}

export function isChatOpenForWrites(booking: BookingShape, now: Date = new Date()): boolean {
  return getChatState(booking, now).kind === "active";
}
