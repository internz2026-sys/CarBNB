import { db } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { NotificationBell } from "./notification-bell";

// Tier 20 — server-side fetcher for the bell. Resolves the current user's
// email, queries the latest 5 notifications + unread count, hands both to
// the client component. Renders nothing for anonymous viewers.
export async function NotificationBellServer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const recipientEmail = user.email.toLowerCase();
  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { recipientEmail },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        linkUrl: true,
        isRead: true,
        createdAt: true,
      },
    }),
    db.notification.count({
      where: { recipientEmail, isRead: false },
    }),
  ]);

  return (
    <NotificationBell notifications={notifications} unreadCount={unreadCount} />
  );
}
