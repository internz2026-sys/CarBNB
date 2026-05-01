"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { OwnerStatus } from "@/types";

export type HostProfileActionState =
  | {
      error: string;
      fieldErrors?: Record<string, string[] | undefined>;
    }
  | { saved: true }
  | null;

// Same status-agnostic guard the rest of the host actions use — bio editing
// is allowed for all logged-in owners regardless of status. Pending hosts
// can fill out their bio while waiting for verification.
async function requireOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    throw new Error("Not authenticated");
  }
  const owner = await db.owner.findUnique({ where: { email: user.email } });
  if (!owner) {
    throw new Error("Not authorized");
  }
  return owner;
}

const UpdateBioSchema = z.object({
  bio: z
    .string()
    .trim()
    .max(500, "Bio must be 500 characters or fewer")
    .optional()
    .or(z.literal("")),
});

export async function updateHostBioAction(
  _prev: HostProfileActionState,
  formData: FormData,
): Promise<HostProfileActionState> {
  let owner: Awaited<ReturnType<typeof requireOwner>>;
  try {
    owner = await requireOwner();
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Authentication required.",
    };
  }

  const parsed = UpdateBioSchema.safeParse({
    bio: formData.get("bio"),
  });
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const trimmed = parsed.data.bio?.trim() ?? "";
  const newBio = trimmed.length > 0 ? trimmed : null;

  if (newBio !== owner.bio) {
    await db.owner.update({
      where: { id: owner.id },
      data: { bio: newBio },
    });

    await db.activityLogEntry.create({
      data: {
        action: "HOST_BIO_UPDATED",
        description: `Host ${owner.email} updated their public bio`,
        type: "owner",
      },
    });
  }

  // Revalidate public profile (only relevant when host is VERIFIED, but
  // cheap to do unconditionally) and the host's own profile editor.
  if (owner.status === OwnerStatus.VERIFIED) {
    revalidatePath(`/hosts/${owner.id}`);
  }
  revalidatePath("/host/profile");

  return { saved: true };
}
