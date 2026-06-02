"use server";

import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { FLEETS_CACHE_TAG } from "@/lib/cached-queries";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { OWNER_DOCUMENTS_BUCKET } from "@/lib/owner-documents";
import { OwnerStatus } from "@/types";

const MAX_DOC_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_DOC_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

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
  // Bio is rendered on the /fleets directory cards (VERIFIED fleets only) —
  // bust the cached directory so an edit shows up immediately.
  revalidateTag(FLEETS_CACHE_TAG, "max");

  return { saved: true };
}

// ─────────────────────────────────────────────────────────────────────────
// Tier 19 — Host self-service document upload. Mirrors the admin-side
// `uploadOwnerDocumentAction` shape but auths as the host themselves and
// only accepts uploads for their own Owner row. Doc kinds:
//   - "id"                    — gov ID (required for all)
//   - "license"               — driver's license (INDIVIDUAL only; skipped
//                               for FLEET per cross-cutting decision #7)
//   - "business_registration" — DTI / SEC / business reg cert
//                               (FLEET only)
// Files land in the existing `owner-documents` bucket at
// `/{ownerId}/{docKind}.{ext}` so the admin viewer + signed-URL helper
// already work for them.
// ─────────────────────────────────────────────────────────────────────────

type HostDocKind = "id" | "license" | "business_registration";

const HOST_DOC_FIELD_MAP: Record<
  HostDocKind,
  "idDocumentUrl" | "licenseDocumentUrl" | "businessRegistrationDocumentUrl"
> = {
  id: "idDocumentUrl",
  license: "licenseDocumentUrl",
  business_registration: "businessRegistrationDocumentUrl",
};

const HOST_DOC_LABEL_MAP: Record<HostDocKind, string> = {
  id: "government ID",
  license: "driver's license",
  business_registration: "business registration document",
};

const HOST_DOC_ACTIVITY_MAP: Record<HostDocKind, string> = {
  id: "HOST_ID_UPLOADED",
  license: "HOST_LICENSE_UPLOADED",
  business_registration: "HOST_BUSINESS_REG_UPLOADED",
};

export async function uploadHostDocumentAction(
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

  const docKindRaw = String(formData.get("docKind") ?? "").trim();
  const file = formData.get("file");

  if (
    docKindRaw !== "id" &&
    docKindRaw !== "license" &&
    docKindRaw !== "business_registration"
  ) {
    return { error: "Invalid document kind." };
  }
  const docKind = docKindRaw as HostDocKind;

  // Kind-vs-host-kind validation per cross-cutting decision #7.
  if (docKind === "license" && owner.kind === "FLEET") {
    return { error: "Driver's license is not required for fleet operators." };
  }
  if (docKind === "business_registration" && owner.kind !== "FLEET") {
    return {
      error: "Business registration document is only for fleet operators.",
    };
  }

  if (!(file instanceof File) || file.name === "") {
    return { error: "Please choose a file to upload." };
  }
  if (!ALLOWED_DOC_TYPES.has(file.type)) {
    return { error: "Only JPG, PNG, WebP, or PDF are allowed." };
  }
  if (file.size === 0) {
    return { error: "File is empty." };
  }
  if (file.size > MAX_DOC_BYTES) {
    return { error: "File is too large (5 MB max)." };
  }

  const extension = file.name.includes(".")
    ? file.name.split(".").pop()!.toLowerCase()
    : file.type === "application/pdf"
      ? "pdf"
      : file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";
  const objectPath = `${owner.id}/${docKind}.${extension}`;

  const supabase = createAdminClient();
  const { error: uploadError } = await supabase.storage
    .from(OWNER_DOCUMENTS_BUCKET)
    .upload(objectPath, file, {
      upsert: true,
      contentType: file.type,
    });
  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  const field = HOST_DOC_FIELD_MAP[docKind];
  await db.owner.update({
    where: { id: owner.id },
    data: { [field]: objectPath },
  });

  await db.activityLogEntry.create({
    data: {
      action: HOST_DOC_ACTIVITY_MAP[docKind],
      description: `Host ${owner.email} uploaded their ${HOST_DOC_LABEL_MAP[docKind]}`,
      type: "owner",
    },
  });

  revalidatePath("/host/profile");
  revalidatePath(`/owners/${owner.id}`);
  return { saved: true };
}

// ─────────────────────────────────────────────────────────────────────────
// Tier 21 — Fleet location pin. Updates Owner.latitude + Owner.longitude
// from a Leaflet pin drop on /host/profile. INDIVIDUAL hosts can't call
// this — fleet location is FLEET-only by design (cross-cutting decision).
// ─────────────────────────────────────────────────────────────────────────

export async function updateFleetLocationAction(
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

  if (owner.kind !== "FLEET") {
    return {
      error: "Only fleet operators can set a map location.",
    };
  }

  const latRaw = String(formData.get("latitude") ?? "").trim();
  const lngRaw = String(formData.get("longitude") ?? "").trim();
  const latitude = Number(latRaw);
  const longitude = Number(lngRaw);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return {
      error: "Please drop a pin on the map before saving.",
    };
  }
  if (latitude < -90 || latitude > 90) {
    return { error: "Latitude must be between -90 and 90." };
  }
  if (longitude < -180 || longitude > 180) {
    return { error: "Longitude must be between -180 and 180." };
  }

  const wasUnset = owner.latitude === null || owner.longitude === null;

  await db.owner.update({
    where: { id: owner.id },
    data: { latitude, longitude },
  });

  await db.activityLogEntry.create({
    data: {
      action: wasUnset ? "FLEET_LOCATION_SET" : "FLEET_LOCATION_UPDATED",
      description: `Fleet ${owner.fullName} (${owner.email}) ${
        wasUnset ? "set their" : "updated their"
      } map location to ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      type: "owner",
    },
  });

  revalidatePath("/host/profile");
  revalidatePath(`/owners/${owner.id}`);
  revalidatePath("/fleets");
  // The pin position powers the /fleets directory map — bust its cache.
  revalidateTag(FLEETS_CACHE_TAG, "max");

  return { saved: true };
}
