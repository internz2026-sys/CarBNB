import { MessageCircleMore, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getChatState } from "@/lib/booking-chat";
import { BookingStatus } from "@/types";
import { ChatConversation, type SerializableChatState } from "./chat-conversation";

type ChatPanelProps = {
  booking: {
    id: string;
    customerId: string;
    ownerId: string;
    status: string;
    rentalCompletedAt: Date | null;
  };
  viewerRole: "customer" | "host" | "admin";
  viewerId: string | null;
};

// Server component. Loads the initial message thread + computes the chat
// state once on render, then hands off to the polling client component.
export async function BookingChatPanel({
  booking,
  viewerRole,
  viewerId,
}: ChatPanelProps) {
  const chatState = getChatState(booking);

  // Hide the panel entirely for PENDING — there's nothing to coordinate
  // before the host accepts. Page sections above already explain the
  // pending state.
  if (chatState.kind === "not-yet") {
    return null;
  }

  // Fetch the initial server-rendered batch. The client polling hook picks
  // up newer messages from this list's last id onward.
  const initialRows = await db.message.findMany({
    where: { bookingId: booking.id },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  const initialMessages = initialRows.map((row) => ({
    id: row.id,
    bookingId: row.bookingId,
    kind: row.kind,
    senderRole: row.senderRole,
    senderId: row.senderId,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  }));

  // For the past-trips link, count COMPLETED bookings between the same
  // (customerId, ownerId) pair, EXCLUDING the current booking. If there's
  // 1+ prior, render the link.
  const priorTripCount = await db.booking.count({
    where: {
      customerId: booking.customerId,
      ownerId: booking.ownerId,
      status: BookingStatus.COMPLETED,
      NOT: { id: booking.id },
    },
  });

  const serializableState: SerializableChatState =
    chatState.kind === "active"
      ? {
          kind: "active",
          gracePeriodEndIso: chatState.gracePeriodEnd
            ? chatState.gracePeriodEnd.toISOString()
            : null,
        }
      : chatState.kind === "closed-grace-expired"
        ? {
            kind: "closed-grace-expired",
            closedAtIso: chatState.closedAt.toISOString(),
          }
        : chatState.kind === "closed-cancelled"
          ? { kind: "closed-cancelled" }
          : { kind: "not-yet" };

  const heading =
    viewerRole === "host"
      ? "Chat with renter"
      : viewerRole === "customer"
        ? "Chat with host"
        : "Trip chat (read-only)";

  const pastTripsHref =
    viewerRole === "customer"
      ? `/account?priorHost=${booking.ownerId}`
      : viewerRole === "host"
        ? `/host/bookings?priorCustomer=${booking.customerId}`
        : null;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MessageCircleMore className="w-4 h-4" />
            {heading}
          </CardTitle>
          {viewerRole === "admin" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-tertiary-fixed px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-tertiary-fixed-variant">
              <ShieldCheck className="w-3 h-3" />
              Admin view
            </span>
          ) : null}
        </div>
        {viewerRole === "admin" ? (
          <p className="text-xs text-on-surface-variant pt-1">
            Read-only access for support and dispute review. You can&apos;t send messages.
          </p>
        ) : (
          <p className="text-xs text-on-surface-variant pt-1">
            For trip coordination only — pickup, drop-off, timing updates. Admin can view
            for support.
          </p>
        )}

        {priorTripCount > 0 && pastTripsHref ? (
          <p className="text-xs text-primary pt-1">
            <Link className="hover:underline" href={pastTripsHref}>
              {viewerRole === "customer"
                ? `You've rented from this host ${priorTripCount}× before — view past trips`
                : `You've rented to this customer ${priorTripCount}× before — view past trips`}
            </Link>
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="pt-4">
        <ChatConversation
          bookingId={booking.id}
          chatState={serializableState}
          initialMessages={initialMessages}
          viewerId={viewerId}
          viewerRole={viewerRole}
        />
      </CardContent>
    </Card>
  );
}
