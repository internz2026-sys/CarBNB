"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchMessagesAfterAction,
  type SerializedMessage,
} from "@/app/actions/messages";

const POLL_INTERVAL_MS = 5000;

// V1 polling hook. Tier 14 abstraction boundary — V2 (Supabase Realtime)
// only needs to rewrite this file; the panel components stay untouched.
//
// Pauses polling when the tab is hidden (Page Visibility API). Resumes
// on focus and immediately fetches anything missed during the blur.
export function useChatMessages(
  bookingId: string,
  initialMessages: SerializedMessage[],
) {
  const [messages, setMessages] = useState<SerializedMessage[]>(initialMessages);
  const lastIdRef = useRef<string | null>(
    initialMessages.length > 0 ? initialMessages[initialMessages.length - 1].id : null,
  );

  // Append a single message immediately (used for optimistic sender updates).
  // The ref also advances so the next poll skips this row instead of
  // duplicating it back into the list.
  const appendLocal = useCallback((msg: SerializedMessage) => {
    setMessages((prev) => {
      // Defensive against double-appends (e.g. server echoes the row before
      // we get the optimistic response — unlikely but cheap to guard).
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
    lastIdRef.current = msg.id;
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      if (cancelled) return;

      // Skip the request entirely while the tab is in the background — the
      // catch-up runs on visibility change.
      if (typeof document !== "undefined" && document.hidden) {
        timer = setTimeout(tick, POLL_INTERVAL_MS);
        return;
      }

      try {
        const result = await fetchMessagesAfterAction(bookingId, lastIdRef.current);
        if (cancelled) return;
        if (result.ok && result.messages.length > 0) {
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m.id));
            const incoming = result.messages.filter((m) => !seen.has(m.id));
            if (incoming.length === 0) return prev;
            return [...prev, ...incoming];
          });
          lastIdRef.current = result.messages[result.messages.length - 1].id;
        }
      } catch {
        // Swallow transient errors. The next tick will retry. We don't
        // surface a UI error for poll failures — that would flicker
        // constantly on bad networks. Send failures DO surface inline,
        // which is where the user is actually paying attention.
      }

      timer = setTimeout(tick, POLL_INTERVAL_MS);
    }

    function onVisibilityChange() {
      if (typeof document !== "undefined" && !document.hidden) {
        // Came back to the tab — fire an immediate fetch instead of waiting
        // for the next scheduled tick.
        if (timer) clearTimeout(timer);
        tick();
      }
    }

    tick();
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibilityChange);
    }

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
    };
  }, [bookingId]);

  return { messages, appendLocal };
}
