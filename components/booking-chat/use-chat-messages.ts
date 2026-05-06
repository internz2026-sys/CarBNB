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
//
// Optimistic-send flow uses `appendOptimistic` → `confirmOptimistic` (or
// `rollbackOptimistic` on error). The cursor (lastIdRef) deliberately is
// NOT advanced for an optimistic row — it must always point at a real DB
// id so the polling tick's cursor lookup keeps working. The cursor only
// advances when we have a real server-issued id (in `confirmOptimistic`
// or in the polling tick itself).
export function useChatMessages(
  bookingId: string,
  initialMessages: SerializedMessage[],
) {
  const [messages, setMessages] = useState<SerializedMessage[]>(initialMessages);
  const lastIdRef = useRef<string | null>(
    initialMessages.length > 0 ? initialMessages[initialMessages.length - 1].id : null,
  );

  // Optimistic insert with a temporary id. Does NOT touch lastIdRef — the
  // polling cursor must always point at a real DB id.
  const appendOptimistic = useCallback((msg: SerializedMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  // Server send succeeded. Swap the optimistic row for the real one, then
  // advance lastIdRef. Handle the race where a poll tick already pulled the
  // real row in (real-X already in the list): in that case just remove the
  // temp row instead of duplicating real-X.
  const confirmOptimistic = useCallback(
    (tempId: string, real: SerializedMessage) => {
      setMessages((prev) => {
        const realAlreadyPresent = prev.some((m) => m.id === real.id);
        if (realAlreadyPresent) {
          return prev.filter((m) => m.id !== tempId);
        }
        return prev.map((m) => (m.id === tempId ? real : m));
      });
      lastIdRef.current = real.id;
    },
    [],
  );

  // Server send failed. Drop the optimistic row. Don't touch lastIdRef.
  const rollbackOptimistic = useCallback((tempId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== tempId));
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

  return { messages, appendOptimistic, confirmOptimistic, rollbackOptimistic };
}
