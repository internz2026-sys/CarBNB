import "server-only";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { NotificationEmail } from "@/emails/notification-email";
import type {
  NotificationRole,
  NotificationTypeValue,
} from "@/lib/notification-types";

// Tier 20 — central notify() helper. Every server action that fires a
// notification calls this. Two side effects per call:
//   1. INSERT a Notification row → drives the in-app bell + archive page
//   2. Send a transactional email via Resend → drives the inbox
// Email send failures don't bubble up; the in-app notification is the
// source of truth. Logged to ActivityLogEntry for audit.

const EMAIL_FROM = "DriveXP <noreply@mail.drivexp.hoversight.agency>";
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://drivexp.hoversight.agency";

// Lazy singleton so the import is cheap when notify isn't called.
let cachedClient: Resend | null = null;
function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!cachedClient) {
    cachedClient = new Resend(process.env.RESEND_API_KEY);
  }
  return cachedClient;
}

interface NotifyInput {
  recipientEmail: string;
  recipientRole: NotificationRole;
  type: NotificationTypeValue;
  title: string;
  body: string;
  /** Relative path (e.g. "/host/bookings/abc") OR absolute URL. */
  linkUrl?: string | null;
  /** Used in both the email greeting and the email subject. Falls back to "" when absent. */
  recipientName?: string;
  /** Label for the email's CTA button. Defaults to "Open DriveXP". */
  linkLabel?: string;
}

// Resolve a relative linkUrl ("/host/bookings/abc") to an absolute URL
// for email links. Absolute URLs (starting with http) pass through.
function resolveLinkUrl(linkUrl?: string | null): string | null {
  if (!linkUrl) return null;
  if (/^https?:\/\//i.test(linkUrl)) return linkUrl;
  const base = APP_URL.replace(/\/$/, "");
  return `${base}${linkUrl.startsWith("/") ? linkUrl : `/${linkUrl}`}`;
}

export async function notify(input: NotifyInput): Promise<{
  notificationId: string;
  emailSent: boolean;
  emailError?: string;
}> {
  const recipientEmail = input.recipientEmail.trim().toLowerCase();

  // Step 1 — DB row. Always runs (in-app bell is the source of truth).
  const notification = await db.notification.create({
    data: {
      recipientEmail,
      recipientRole: input.recipientRole,
      type: input.type,
      title: input.title,
      body: input.body,
      linkUrl: input.linkUrl ?? null,
    },
  });

  // Step 2 — outbound email. Best-effort; doesn't fail the action if
  // Resend is unreachable, key is missing, or rate-limited.
  let emailSent = false;
  let emailError: string | undefined;
  const resend = getResendClient();
  if (resend) {
    try {
      const absoluteLink = resolveLinkUrl(input.linkUrl);
      const { error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: recipientEmail,
        subject: input.title,
        react: NotificationEmail({
          recipientName: input.recipientName,
          title: input.title,
          body: input.body,
          linkUrl: absoluteLink,
          linkLabel: input.linkLabel,
          preview: input.body.slice(0, 120),
        }),
      });
      if (error) {
        emailError = error.message;
      } else {
        emailSent = true;
      }
    } catch (err) {
      emailError = err instanceof Error ? err.message : "Unknown email error";
    }
  } else {
    emailError = "RESEND_API_KEY not configured";
  }

  // Audit log — captures both success and failure so admin / dev can
  // diagnose missing emails after the fact.
  await db.activityLogEntry.create({
    data: {
      action: "NOTIFICATION_SENT",
      description:
        `Notification ${input.type} sent to ${input.recipientRole} ${recipientEmail}.` +
        ` Email: ${emailSent ? "sent" : `skipped (${emailError ?? "unknown"})`}`,
      type: "notification",
    },
  });

  return {
    notificationId: notification.id,
    emailSent,
    emailError,
  };
}

// Convenience for fanning out the same notification to multiple
// recipients (booking created → host + admin, booking cancelled → both
// parties). Each notify() call is independent; one failure doesn't
// affect the others.
export async function notifyMany(
  inputs: NotifyInput[],
): Promise<Awaited<ReturnType<typeof notify>>[]> {
  const results: Awaited<ReturnType<typeof notify>>[] = [];
  for (const input of inputs) {
    // Sequential — keeps the activity log entries in order.
    results.push(await notify(input));
  }
  return results;
}
