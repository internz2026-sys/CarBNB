import "server-only";

import { db } from "@/lib/db";

// Server-only helper for writing system-kind messages alongside booking
// status transitions. Imported by the booking transition actions
// (host-bookings, admin-bookings, customer bookings) so each Confirm /
// Start / Complete / Cancel / Reject writes a paired system row visible
// inline in the chat thread.
//
// The chat tier locked the rule: system rows are auto-injected; users
// don't author them. senderRole = "system", senderId = null, kind =
// "system". Fail-soft on errors — a system-message write must never
// block a status transition (the booking lifecycle is the source of
// truth, the system message is just narration).
export async function writeBookingSystemMessage(
  bookingId: string,
  body: string,
): Promise<void> {
  try {
    await db.message.create({
      data: {
        bookingId,
        kind: "system",
        senderRole: "system",
        senderId: null,
        body,
      },
    });
  } catch (err) {
    console.error("writeBookingSystemMessage failed:", err);
    // Swallow — see comment above.
  }
}
