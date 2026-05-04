"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { isChatOpenForWrites, MESSAGE_BODY_MAX } from "@/lib/booking-chat";

// ─────────────────────────────────────────────────────────────────────────
// Auth resolver — returns either { kind: "customer", id } or
// { kind: "host", id } based on the authed user's matching DB row. The
// chat is between the booking's customer and the booking's owner; admin
// is read-only (no send), so this resolver intentionally rejects admin
// emails.
// ─────────────────────────────────────────────────────────────────────────

type ChatSender =
  | { kind: "customer"; id: string }
  | { kind: "host"; id: string };

async function resolveChatSender(): Promise<ChatSender | { kind: "denied"; reason: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { kind: "denied", reason: "Not authenticated" };

  const [customer, owner] = await Promise.all([
    db.customer.findUnique({ where: { email: user.email }, select: { id: true } }),
    db.owner.findUnique({ where: { email: user.email }, select: { id: true } }),
  ]);

  if (customer) return { kind: "customer", id: customer.id };
  if (owner) return { kind: "host", id: owner.id };
  return {
    kind: "denied",
    reason: "Only customers or hosts on the booking can send messages.",
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Send — guarded by ownership (sender is the booking's customer OR owner)
// + lifecycle window (CONFIRMED / ONGOING / COMPLETED + 48h grace).
// ─────────────────────────────────────────────────────────────────────────

export type SendMessageResult =
  | { ok: true; message: SerializedMessage }
  | { ok: false; error: string };

const SendMessageSchema = z.object({
  bookingId: z.string().trim().min(1),
  body: z
    .string()
    .trim()
    .min(1, "Message can't be empty.")
    .max(MESSAGE_BODY_MAX, `Message must be ${MESSAGE_BODY_MAX} characters or fewer.`),
});

export async function sendMessageAction(
  bookingId: string,
  body: string,
): Promise<SendMessageResult> {
  const parsed = SendMessageSchema.safeParse({ bookingId, body });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid message.",
    };
  }

  const sender = await resolveChatSender();
  if (sender.kind === "denied") {
    return { ok: false, error: sender.reason };
  }

  const booking = await db.booking.findUnique({
    where: { id: parsed.data.bookingId },
    select: {
      id: true,
      customerId: true,
      ownerId: true,
      status: true,
      rentalCompletedAt: true,
    },
  });
  if (!booking) return { ok: false, error: "Booking not found." };

  // Sender must be either the booking's customer or its owner.
  const isCustomerOnBooking =
    sender.kind === "customer" && sender.id === booking.customerId;
  const isHostOnBooking = sender.kind === "host" && sender.id === booking.ownerId;
  if (!isCustomerOnBooking && !isHostOnBooking) {
    return {
      ok: false,
      error: "You can only message bookings you're part of.",
    };
  }

  // Lifecycle window check.
  if (!isChatOpenForWrites(booking)) {
    return {
      ok: false,
      error: "This chat is no longer accepting new messages.",
    };
  }

  const created = await db.message.create({
    data: {
      bookingId: booking.id,
      kind: "user",
      senderRole: sender.kind,
      senderId: sender.id,
      body: parsed.data.body,
    },
    select: {
      id: true,
      bookingId: true,
      kind: true,
      senderRole: true,
      senderId: true,
      body: true,
      createdAt: true,
    },
  });

  // Revalidate so the next server-rendered hit (admin list, etc.) reflects
  // the new row. The polling hook on the active panel doesn't depend on
  // this — it'll fetch the row directly via fetchMessagesAfterAction.
  revalidatePath(`/account/bookings/${booking.id}`);
  revalidatePath(`/host/bookings/${booking.id}`);
  revalidatePath(`/bookings/${booking.id}`);

  return { ok: true, message: serializeMessage(created) };
}

// ─────────────────────────────────────────────────────────────────────────
// Fetch — the polling hook calls this every 5s with the last message id
// it has rendered. Returns any messages newer than that id, in chrono
// order. Same auth guard as send (you can't poll a chat you're not on),
// except we ALSO allow admin so the read-only admin panel works.
// ─────────────────────────────────────────────────────────────────────────

export type SerializedMessage = {
  id: string;
  bookingId: string;
  kind: string;
  senderRole: string;
  senderId: string | null;
  body: string;
  createdAt: string; // ISO
};

export type FetchMessagesResult =
  | { ok: true; messages: SerializedMessage[] }
  | { ok: false; error: string };

export async function fetchMessagesAfterAction(
  bookingId: string,
  lastSeenId: string | null,
): Promise<FetchMessagesResult> {
  if (typeof bookingId !== "string" || bookingId.length === 0) {
    return { ok: false, error: "Missing booking id." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "Not authenticated." };

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, customerId: true, ownerId: true },
  });
  if (!booking) return { ok: false, error: "Booking not found." };

  // Authorize: customer / owner / admin (read-only) can poll this booking's chat.
  const [customer, owner, admin] = await Promise.all([
    db.customer.findUnique({ where: { email: user.email }, select: { id: true } }),
    db.owner.findUnique({ where: { email: user.email }, select: { id: true } }),
    db.user.findUnique({ where: { email: user.email }, select: { id: true } }),
  ]);
  const allowed =
    (customer && customer.id === booking.customerId) ||
    (owner && owner.id === booking.ownerId) ||
    Boolean(admin);
  if (!allowed) {
    return { ok: false, error: "You can only view chats you're part of." };
  }

  let cursorCreatedAt: Date | null = null;
  if (lastSeenId) {
    const cursor = await db.message.findUnique({
      where: { id: lastSeenId },
      select: { createdAt: true, bookingId: true },
    });
    // Only honor the cursor if it actually belongs to this booking — guards
    // against a stale or forged client cursor.
    if (cursor && cursor.bookingId === bookingId) {
      cursorCreatedAt = cursor.createdAt;
    }
  }

  const rows = await db.message.findMany({
    where: {
      bookingId,
      ...(cursorCreatedAt ? { createdAt: { gt: cursorCreatedAt } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 200, // soft cap; chats are small enough this is fine
  });

  return { ok: true, messages: rows.map(serializeMessage) };
}

function serializeMessage(row: {
  id: string;
  bookingId: string;
  kind: string;
  senderRole: string;
  senderId: string | null;
  body: string;
  createdAt: Date;
}): SerializedMessage {
  return {
    id: row.id,
    bookingId: row.bookingId,
    kind: row.kind,
    senderRole: row.senderRole,
    senderId: row.senderId,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}
