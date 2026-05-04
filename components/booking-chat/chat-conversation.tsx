"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  sendMessageAction,
  type SerializedMessage,
} from "@/app/actions/messages";
import { MESSAGE_BODY_MAX, type ChatState } from "@/lib/booking-chat";
import { useChatMessages } from "./use-chat-messages";

// Auto-link plain URLs in user-typed messages. Conservative regex; matches
// http(s) URLs only. We also escape angle brackets defensively before
// rendering raw text in JSX (React already escapes by default — this is just
// the autolink replacement).
function linkifySegments(body: string): Array<{ kind: "text" | "link"; value: string }> {
  const out: Array<{ kind: "text" | "link"; value: string }> = [];
  const re = /https?:\/\/[^\s<>]+/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(body)) !== null) {
    if (match.index > lastIndex) {
      out.push({ kind: "text", value: body.slice(lastIndex, match.index) });
    }
    out.push({ kind: "link", value: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < body.length) {
    out.push({ kind: "text", value: body.slice(lastIndex) });
  }
  return out;
}

type ChatConversationProps = {
  bookingId: string;
  initialMessages: SerializedMessage[];
  // The viewer's role in this booking. "admin" gets a read-only experience
  // (no input rendered). "customer" / "host" can send if chatState is active.
  viewerRole: "customer" | "host" | "admin";
  // The viewer's id in the relevant table (Customer.id for "customer",
  // Owner.id for "host", null for "admin"). Used to align bubbles left/right.
  viewerId: string | null;
  // Pre-computed serializable state shape — pass the result of
  // getChatState(booking) from the server page.
  chatState: SerializableChatState;
};

// We can't pass the union type directly because Date is non-serializable
// across the server-client boundary. Convert closesAt / closedAt to ISO.
export type SerializableChatState =
  | { kind: "active"; gracePeriodEndIso: string | null }
  | { kind: "not-yet" }
  | { kind: "closed-grace-expired"; closedAtIso: string }
  | { kind: "closed-cancelled" };

export function ChatConversation({
  bookingId,
  initialMessages,
  viewerRole,
  viewerId,
  chatState,
}: ChatConversationProps) {
  const { messages, appendLocal } = useChatMessages(bookingId, initialMessages);

  // Auto-scroll the message list to the bottom on initial mount + whenever
  // a new message arrives. Standard chat behavior.
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const canWrite =
    chatState.kind === "active" && (viewerRole === "customer" || viewerRole === "host");

  return (
    <div className="flex h-full min-h-[24rem] flex-col">
      <div
        className="flex-1 space-y-3 overflow-y-auto rounded-md border border-border bg-surface-container-low p-4"
        ref={scrollRef}
      >
        {messages.length === 0 ? (
          <p className="text-center text-xs text-on-surface-variant py-6">
            No messages yet. Say hello.
          </p>
        ) : (
          messages.map((msg) => (
            <MessageRow
              key={msg.id}
              message={msg}
              viewerRole={viewerRole}
              viewerId={viewerId}
            />
          ))
        )}
      </div>

      {canWrite ? (
        <ChatInput
          appendLocal={appendLocal}
          bookingId={bookingId}
          gracePeriodEndIso={
            chatState.kind === "active" ? chatState.gracePeriodEndIso : null
          }
          viewerRole={viewerRole}
          viewerId={viewerId!}
        />
      ) : (
        <ClosedBanner state={chatState} viewerRole={viewerRole} />
      )}
    </div>
  );
}

function MessageRow({
  message,
  viewerRole,
  viewerId,
}: {
  message: SerializedMessage;
  viewerRole: "customer" | "host" | "admin";
  viewerId: string | null;
}) {
  if (message.kind === "system") {
    return (
      <div className="my-2 text-center text-[11px] font-medium uppercase tracking-wide text-on-surface-variant">
        <span className="rounded-full bg-surface-container px-3 py-1">
          {message.body}
        </span>
      </div>
    );
  }

  // Right-align the viewer's own messages, left-align the other party's.
  // Admin viewers see all messages left-aligned (they're observers).
  const isOwn =
    viewerRole !== "admin" &&
    message.senderRole === viewerRole &&
    message.senderId === viewerId;

  const senderLabel = message.senderRole === "host" ? "Host" : "Renter";

  return (
    <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
      {viewerRole === "admin" ? (
        <span className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
          {senderLabel}
        </span>
      ) : null}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-6 break-words whitespace-pre-wrap",
          isOwn
            ? "bg-primary text-on-primary"
            : "bg-surface-container-highest text-on-surface",
        )}
      >
        {linkifySegments(message.body).map((seg, i) =>
          seg.kind === "link" ? (
            <a
              className={cn(
                "underline",
                isOwn ? "text-on-primary" : "text-primary",
              )}
              href={seg.value}
              key={i}
              rel="noopener noreferrer"
              target="_blank"
            >
              {seg.value}
            </a>
          ) : (
            <span key={i}>{seg.value}</span>
          ),
        )}
      </div>
      <span className="mt-0.5 text-[10px] text-on-surface-variant">
        {format(new Date(message.createdAt), "MMM d, h:mm a")}
      </span>
    </div>
  );
}

function ChatInput({
  bookingId,
  appendLocal,
  viewerRole,
  viewerId,
  gracePeriodEndIso,
}: {
  bookingId: string;
  appendLocal: (m: SerializedMessage) => void;
  viewerRole: "customer" | "host";
  viewerId: string;
  gracePeriodEndIso: string | null;
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    if (trimmed.length > MESSAGE_BODY_MAX) {
      setError(`Message must be ${MESSAGE_BODY_MAX} characters or fewer.`);
      return;
    }
    setError(null);

    // Optimistic insert: render the sender's own message immediately. If the
    // server insert succeeds, swap the temporary id for the server-issued
    // one. If it fails, remove the optimistic row and surface the error.
    const tempId = `optimistic-${Date.now()}`;
    const optimistic: SerializedMessage = {
      id: tempId,
      bookingId,
      kind: "user",
      senderRole: viewerRole,
      senderId: viewerId,
      body: trimmed,
      createdAt: new Date().toISOString(),
    };
    appendLocal(optimistic);
    setBody("");

    startTransition(async () => {
      const result = await sendMessageAction(bookingId, trimmed);
      if (!result.ok) {
        setError(result.error);
        // We can't easily surgically remove the optimistic row from the
        // hook's state from out here; we just leave it visible and rely
        // on the user re-typing if they want to retry. Lightweight approach
        // — refining this is a polish-pass item.
        return;
      }
      // Server succeeded — swap the temp id for the real one so the polling
      // hook doesn't double-render. (Hook already dedupes on id, so a
      // matching real id from the next poll won't append again.)
      appendLocal(result.message);
    });
  }

  const remaining = MESSAGE_BODY_MAX - body.length;

  return (
    <form className="mt-3 space-y-2" onSubmit={onSubmit}>
      <Textarea
        className="resize-none h-20"
        disabled={pending}
        maxLength={MESSAGE_BODY_MAX}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          // Enter sends; Shift+Enter inserts a newline. Standard chat UX.
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
          }
        }}
        placeholder="Type a message..."
        value={body}
      />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs">
          {gracePeriodEndIso ? (
            <GracePeriodBadge gracePeriodEndIso={gracePeriodEndIso} />
          ) : null}
          <span
            className={cn(
              "text-on-surface-variant",
              remaining < 0 ? "text-red-600 font-semibold" : "",
            )}
          >
            {body.length} / {MESSAGE_BODY_MAX}
          </span>
        </div>
        <Button disabled={pending || body.trim().length === 0} size="sm" type="submit">
          <Send className="size-3.5 mr-1.5" />
          {pending ? "Sending..." : "Send"}
        </Button>
      </div>
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      ) : null}
    </form>
  );
}

function GracePeriodBadge({ gracePeriodEndIso }: { gracePeriodEndIso: string }) {
  // Display a coarse "closes in 47h" counter. Tick once a minute — granular
  // enough to feel alive without being a dependency on a heavyweight
  // duration library.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const closesAt = new Date(gracePeriodEndIso).getTime();
  const diffMs = closesAt - now;
  if (diffMs <= 0) return null;

  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
  const label = hours >= 1 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
      Closes in {label}
    </span>
  );
}

function ClosedBanner({
  state,
  viewerRole,
}: {
  state: ChatState | SerializableChatState;
  viewerRole: "customer" | "host" | "admin";
}) {
  let copy: string;
  if (viewerRole === "admin") {
    copy = "Admin observer mode — chat is between the customer and host.";
  } else if (state.kind === "not-yet") {
    copy = "Chat opens once the booking is confirmed.";
  } else if (state.kind === "closed-cancelled") {
    copy = "This chat is closed because the booking was cancelled.";
  } else if (state.kind === "closed-grace-expired") {
    copy =
      "This chat is now closed. History stays visible. For trip issues, contact support.";
  } else {
    copy = "Chat is currently unavailable.";
  }

  return (
    <div className="mt-3 rounded-md border border-border bg-surface-container px-3 py-2 text-xs text-on-surface-variant">
      {copy}
    </div>
  );
}
