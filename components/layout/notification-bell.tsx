"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { Bell, BellDot } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/app/actions/notifications";

export type BellNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: Date;
};

// Tier 20 — bell icon for the TopNav / UserMenu row. Server component
// wrappers (per-role) fetch the user's most recent 5 notifications and
// unread count, pass them in as props. Client component owns the
// dropdown open/close + click → mark-read → navigate flow.
export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: BellNotification[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleClick = (n: BellNotification) => {
    const fd = new FormData();
    fd.set("notificationId", n.id);
    startTransition(async () => {
      if (!n.isRead) {
        await markNotificationReadAction(fd);
      }
      setOpen(false);
      if (n.linkUrl) {
        router.push(n.linkUrl);
      } else {
        router.refresh();
      }
    });
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  };

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        aria-label="Notifications"
        className={cn(
          "relative inline-flex size-9 items-center justify-center rounded-full bg-surface-container-lowest text-on-surface shadow-[0_4px_16px_rgb(19_27_46_/_0.05)]",
          "hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        )}
      >
        {unreadCount > 0 ? <BellDot className="size-5" /> : <Bell className="size-5" />}
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 grid min-w-[1.125rem] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[20rem] max-w-[calc(100vw-2rem)] rounded-xl bg-surface-container-lowest p-0 shadow-[0_12px_40px_rgb(19_27_46_/_0.08)] ring-1 ring-foreground/5 outline-none"
        sideOffset={6}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-bold text-on-surface">Notifications</h3>
          {unreadCount > 0 ? (
            <button
              className="text-[11px] font-semibold text-primary hover:underline disabled:opacity-50"
              disabled={pending}
              onClick={handleMarkAllRead}
              type="button"
            >
              Mark all read
            </button>
          ) : null}
        </div>

        <div className="max-h-[24rem] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-on-surface-variant">
              <Bell className="mx-auto mb-2 size-6 opacity-40" />
              <p>You&apos;re all caught up.</p>
            </div>
          ) : (
            <ul>
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    className={cn(
                      "block w-full px-4 py-3 text-left transition hover:bg-surface-container",
                      !n.isRead && "bg-primary/[0.04]",
                    )}
                    disabled={pending}
                    onClick={() => handleClick(n)}
                    type="button"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-1.5 size-2 shrink-0 rounded-full",
                          n.isRead ? "bg-transparent" : "bg-primary",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-sm leading-5 text-on-surface",
                            !n.isRead && "font-semibold",
                          )}
                        >
                          {n.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-on-surface-variant">
                          {n.body}
                        </p>
                        <p className="mt-1 text-[10px] uppercase tracking-wide text-on-surface-variant">
                          {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border px-4 py-2 text-center">
          <Link
            className="text-xs font-semibold text-primary hover:underline"
            href="/notifications"
            onClick={() => setOpen(false)}
          >
            View all notifications →
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
