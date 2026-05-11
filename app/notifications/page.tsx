import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Bell, BellOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { db } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/app/actions/notifications";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notifications | DriveXP",
  description: "All your DriveXP notifications in one place.",
};

// Tier 20 — full archive of the current user's notifications. Renders
// regardless of role (admin / host / customer all see their own list,
// scoped by recipientEmail). Click a notification → server-action
// marks it read + a Link below navigates them to the relevant entity
// page.
export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    redirect("/login?redirectTo=/notifications");
  }

  const recipientEmail = user.email.toLowerCase();
  const notifications = await db.notification.findMany({
    where: { recipientEmail },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const hasAny = notifications.length > 0;

  return (
    <div className="min-h-screen bg-surface pb-16 font-sans">
      <section className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
        <div className="mb-6">
          <Link
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "-ml-3 text-on-surface-variant",
            )}
            href="/"
          >
            <ArrowLeft className="mr-1 size-4" />
            Back
          </Link>
        </div>

        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
              Notifications
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              {unreadCount > 0
                ? `${unreadCount} unread · ${notifications.length} total`
                : `${notifications.length} total`}
            </p>
          </div>
          {unreadCount > 0 ? (
            <form action={markAllNotificationsReadAction}>
              <button
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                type="submit"
              >
                Mark all as read
              </button>
            </form>
          ) : null}
        </div>

        {!hasAny ? (
          <div className="rounded-2xl bg-surface-container-low p-12 text-center">
            <BellOff className="mx-auto mb-3 size-8 text-on-surface-variant opacity-60" />
            <p className="text-sm font-semibold text-on-surface">No notifications yet</p>
            <p className="mt-1 text-xs text-on-surface-variant">
              When something happens that needs your attention, it&apos;ll
              show up here.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {notifications.map((n) => (
              <li key={n.id}>
                <article
                  className={cn(
                    "flex items-start gap-3 rounded-2xl p-5",
                    n.isRead
                      ? "bg-surface-container-low"
                      : "bg-primary/[0.06] ring-1 ring-primary/20",
                  )}
                >
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      n.isRead ? "bg-transparent" : "bg-primary",
                    )}
                    aria-hidden
                  />
                  <Bell className="mt-0.5 size-5 shrink-0 text-on-surface-variant" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3
                        className={cn(
                          "text-sm leading-5 text-on-surface",
                          !n.isRead && "font-semibold",
                        )}
                      >
                        {n.title}
                      </h3>
                      <span className="text-[10px] uppercase tracking-wide text-on-surface-variant">
                        {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                      {n.body}
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      {n.linkUrl ? (
                        <Link
                          className="text-xs font-semibold text-primary hover:underline"
                          href={n.linkUrl}
                        >
                          Open →
                        </Link>
                      ) : null}
                      {!n.isRead ? (
                        <form action={markNotificationReadAction}>
                          <input
                            name="notificationId"
                            type="hidden"
                            value={n.id}
                          />
                          <button
                            className="text-xs font-semibold text-on-surface-variant hover:text-primary hover:underline"
                            type="submit"
                          >
                            Mark as read
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
