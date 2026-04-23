"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { upsertPlatformSettings } from "@/lib/platform-settings-server";

export type SettingsActionState =
  | {
      ok: true;
      message: string;
    }
  | {
      error: string;
      fieldErrors?: Record<string, string[] | undefined>;
    }
  | null;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("Not authenticated");
  const admin = await db.user.findUnique({ where: { email: user.email } });
  if (!admin) throw new Error("Not authorized");
  return admin;
}

// Commission arrives as a percentage (0-100); stored as a fraction (0-1).
const SettingsSchema = z.object({
  commissionRatePercent: z.coerce
    .number()
    .min(0, "Commission cannot be negative")
    .max(50, "Commission over 50% is almost certainly a mistake — cap is 50%"),
  securityDeposit: z.coerce.number().min(0, "Deposit cannot be negative"),
  autoApproveVerifiedCustomers: z.coerce.boolean(),
  requireOwnerConfirmation: z.coerce.boolean(),
  minimumBookingNoticeHours: z.coerce
    .number()
    .int()
    .min(0, "Notice cannot be negative")
    .max(720, "Notice over 30 days is almost certainly a mistake"),
});

export async function updatePlatformSettingsAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const admin = await requireAdmin();

  const parsed = SettingsSchema.safeParse({
    commissionRatePercent: formData.get("commissionRatePercent"),
    securityDeposit: formData.get("securityDeposit"),
    // Switch inputs send "on" when checked, absent when unchecked
    autoApproveVerifiedCustomers: formData.get("autoApproveVerifiedCustomers") === "on",
    requireOwnerConfirmation: formData.get("requireOwnerConfirmation") === "on",
    minimumBookingNoticeHours: formData.get("minimumBookingNoticeHours"),
  });

  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  await upsertPlatformSettings({
    commissionRate: data.commissionRatePercent / 100,
    securityDeposit: data.securityDeposit,
    autoApproveVerifiedCustomers: data.autoApproveVerifiedCustomers,
    requireOwnerConfirmation: data.requireOwnerConfirmation,
    minimumBookingNoticeHours: data.minimumBookingNoticeHours,
    updatedBy: admin.email,
  });

  await db.activityLogEntry.create({
    data: {
      action: "SETTINGS_UPDATED",
      description: `Admin ${admin.email} updated platform settings (commission ${data.commissionRatePercent}%, deposit ₱${data.securityDeposit}, notice ${data.minimumBookingNoticeHours}h)`,
      type: "system",
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true, message: "Settings saved." };
}
