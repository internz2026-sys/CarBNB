"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { CustomerStatus } from "@/types";
import { notify } from "@/lib/notify";
import { NotificationType } from "@/lib/notification-types";

export type CustomerActionState =
  | {
      error: string;
    }
  | { saved: true }
  | null;

// Tier 19 — admin status transitions for customers. Mirrors the
// approve/suspend shape of the owner actions but with a third "Reject"
// transition (matches the CustomerStatus enum). Reject vs Suspend:
//  - Reject = "your docs were no good; please re-upload to retry"
//             (customer can re-upload, status flips back to PENDING)
//  - Suspend = "something more serious; cannot book until support
//              intervenes" (admin-only re-instate)

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    throw new Error("Not authenticated");
  }
  const admin = await db.user.findUnique({ where: { email: user.email } });
  if (!admin) {
    throw new Error("Not authorized");
  }
  return admin;
}

async function transitionCustomerStatus({
  customerId,
  newStatus,
  activityCode,
  activityVerb,
}: {
  customerId: string;
  newStatus: CustomerStatus;
  activityCode: string;
  activityVerb: string;
}): Promise<CustomerActionState> {
  let admin: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    admin = await requireAdmin();
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Authentication required.",
    };
  }

  const customer = await db.customer.findUnique({ where: { id: customerId } });
  if (!customer) return { error: "Customer not found." };
  if (customer.status === newStatus) {
    return { error: `Customer is already ${newStatus}.` };
  }

  await db.customer.update({
    where: { id: customerId },
    data: { status: newStatus },
  });

  await db.activityLogEntry.create({
    data: {
      action: activityCode,
      description: `Admin ${admin.email} ${activityVerb} customer ${customer.fullName} (${customer.email})`,
      type: "customer",
    },
  });

  // Tier 20 — notify the customer on status transitions they need to know
  // about. We skip notifications for the "flag for re-verification" PENDING
  // case since that's covered by the dashboard banner + verification page.
  if (newStatus === CustomerStatus.VERIFIED) {
    await notify({
      recipientEmail: customer.email,
      recipientRole: "customer",
      recipientName: customer.fullName,
      type: NotificationType.CUSTOMER_VERIFIED,
      title: "Your identity has been verified",
      body: `Welcome to DriveXP, ${customer.fullName.split(" ")[0]}! Your identity is verified and you can now book any active listing.`,
      linkUrl: "/listings",
      linkLabel: "Browse cars",
    });
  } else if (newStatus === CustomerStatus.REJECTED) {
    await notify({
      recipientEmail: customer.email,
      recipientRole: "customer",
      recipientName: customer.fullName,
      type: NotificationType.CUSTOMER_REJECTED,
      title: "Verification needs re-submission",
      body: "Your verification documents were rejected. Please upload clear copies of your government ID and driver's license to re-submit for review.",
      linkUrl: "/account/verification",
      linkLabel: "Re-upload documents",
    });
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/dashboard");
  return { saved: true };
}

export async function verifyCustomerAction(
  _prev: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const customerId = String(formData.get("customerId") ?? "").trim();
  if (!customerId) return { error: "Missing customer id." };
  return transitionCustomerStatus({
    customerId,
    newStatus: CustomerStatus.VERIFIED,
    activityCode: "CUSTOMER_VERIFIED",
    activityVerb: "verified",
  });
}

export async function rejectCustomerAction(
  _prev: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const customerId = String(formData.get("customerId") ?? "").trim();
  if (!customerId) return { error: "Missing customer id." };
  return transitionCustomerStatus({
    customerId,
    newStatus: CustomerStatus.REJECTED,
    activityCode: "CUSTOMER_REJECTED",
    activityVerb: "rejected verification for",
  });
}

export async function suspendCustomerAction(
  _prev: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const customerId = String(formData.get("customerId") ?? "").trim();
  if (!customerId) return { error: "Missing customer id." };
  return transitionCustomerStatus({
    customerId,
    newStatus: CustomerStatus.SUSPENDED,
    activityCode: "CUSTOMER_SUSPENDED",
    activityVerb: "suspended",
  });
}

// Admin can manually flag a verified customer for re-verification (per
// cross-cutting decision #4). Flips status back to PENDING; existing
// docs stay in place so the customer can re-submit by uploading
// replacements.
export async function flagCustomerForReverificationAction(
  _prev: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const customerId = String(formData.get("customerId") ?? "").trim();
  if (!customerId) return { error: "Missing customer id." };
  return transitionCustomerStatus({
    customerId,
    newStatus: CustomerStatus.PENDING,
    activityCode: "CUSTOMER_FLAGGED_FOR_REVERIFICATION",
    activityVerb: "flagged for re-verification",
  });
}
