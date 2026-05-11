"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";

// Tier 20 — read-state mutations. Notifications are recipient-keyed by
// email (matched against Supabase auth.users.email), so the only auth
// check is "are you the authenticated user whose email matches the
// recipientEmail on the row." Admins don't get to mark other users'
// notifications read.

async function requireUserEmail(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    throw new Error("Not authenticated");
  }
  return user.email.toLowerCase();
}

export async function markNotificationReadAction(
  formData: FormData,
): Promise<void> {
  const email = await requireUserEmail();
  const id = String(formData.get("notificationId") ?? "").trim();
  if (!id) return;

  // Guard: only the recipient can mark it read.
  await db.notification.updateMany({
    where: { id, recipientEmail: email, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  revalidatePath("/notifications");
  // Bell badge counts re-fetch on next render across any layout.
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const email = await requireUserEmail();
  await db.notification.updateMany({
    where: { recipientEmail: email, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  revalidatePath("/notifications");
}
