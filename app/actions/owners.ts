"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { OwnerStatus } from "@/types";

const OWNER_DOCUMENTS_BUCKET = "owner-documents";
const MAX_DOC_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_DOC_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export type OwnerActionState =
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
  if (!user?.email) {
    throw new Error("Not authenticated");
  }
  const admin = await db.user.findUnique({ where: { email: user.email } });
  if (!admin) {
    throw new Error("Not authorized");
  }
  return admin;
}

// Admin creates an owner AND provisions a Supabase Auth user with a temp
// password the admin sets here. The admin communicates that password to the
// owner out-of-band. Owner can sign in and change it. This differs from
// self-signup (app/(auth)/actions.ts) in that the admin chooses the initial
// password rather than the owner.
const CreateOwnerSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  email: z.string().trim().toLowerCase().email("Invalid email"),
  contactNumber: z.string().trim().min(1, "Contact number is required"),
  address: z.string().trim().min(1, "Address is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  bankDetails: z.string().trim().optional().or(z.literal("")),
  remarks: z.string().trim().optional().or(z.literal("")),
  statusKey: z.enum(["pending", "verified"]).optional(),
});

const STATUS_KEY_TO_VALUE: Record<"pending" | "verified", OwnerStatus> = {
  pending: OwnerStatus.PENDING,
  verified: OwnerStatus.VERIFIED,
};

export async function createOwnerAction(
  _prev: OwnerActionState,
  formData: FormData,
): Promise<OwnerActionState> {
  const admin = await requireAdmin();

  const parsed = CreateOwnerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    contactNumber: formData.get("contactNumber"),
    address: formData.get("address"),
    password: formData.get("password"),
    bankDetails: formData.get("bankDetails"),
    remarks: formData.get("remarks"),
    statusKey: formData.get("statusKey") ?? undefined,
  });

  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const status = STATUS_KEY_TO_VALUE[data.statusKey ?? "pending"];

  // Collision check against all role tables. Supabase Auth will also error
  // if the email is already registered, but catching it here gives a clearer
  // message than the raw auth error.
  const [existingOwner, existingCustomer, existingUser] = await Promise.all([
    db.owner.findUnique({ where: { email: data.email } }),
    db.customer.findUnique({ where: { email: data.email } }),
    db.user.findUnique({ where: { email: data.email } }),
  ]);
  if (existingOwner || existingCustomer || existingUser) {
    return { error: "An account with this email already exists." };
  }

  // Create Supabase Auth user first so we have a rollback point if DB insert
  // fails. `email_confirm: true` skips the verification email — admin has
  // already vetted this owner offline.
  const supabaseAdmin = createAdminClient();
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { fullName: data.fullName, createdBy: "admin" },
    });

  if (authError || !authData.user) {
    return {
      error: `Could not create auth account: ${authError?.message ?? "unknown error"}`,
    };
  }

  try {
    const owner = await db.owner.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        contactNumber: data.contactNumber,
        address: data.address,
        bankDetails: data.bankDetails || null,
        remarks: data.remarks || null,
        status,
      },
    });

    await db.activityLogEntry.create({
      data: {
        action: "OWNER_CREATED",
        description: `Admin ${admin.email} created owner ${owner.fullName} (${owner.email}) with status "${owner.status}" and provisioned auth account`,
        type: "owner",
      },
    });

    revalidatePath("/owners");
    redirect(`/owners/${owner.id}`);
  } catch (err) {
    // Rollback: delete the auth user we just created so email isn't locked.
    // Swallow rollback errors — the user-visible message describes the
    // original DB failure.
    if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
      throw err; // redirect() throws; let it propagate
    }
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id).catch(() => {});
    return {
      error: `Database insert failed; auth account rolled back. ${err instanceof Error ? err.message : ""}`,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Status transitions — approve / suspend / reactivate
// ─────────────────────────────────────────────────────────────────────────

async function updateOwnerStatus(
  formData: FormData,
  targetStatus: OwnerStatus,
  allowedFrom: OwnerStatus[],
  verb: string,
): Promise<OwnerActionState> {
  const admin = await requireAdmin();

  const id = String(formData.get("ownerId") ?? "").trim();
  if (!id) {
    return { error: "Missing owner id." };
  }

  const owner = await db.owner.findUnique({ where: { id } });
  if (!owner) {
    return { error: "Owner not found." };
  }
  if (!(allowedFrom as string[]).includes(owner.status)) {
    return {
      error: `Cannot ${verb} an owner whose current status is "${owner.status}".`,
    };
  }

  await db.owner.update({
    where: { id },
    data: { status: targetStatus },
  });

  await db.activityLogEntry.create({
    data: {
      action: `OWNER_${verb.toUpperCase()}`,
      description: `Admin ${admin.email} ${verb}d owner ${owner.fullName} (${owner.email}): ${owner.status} → ${targetStatus}`,
      type: "owner",
    },
  });

  revalidatePath("/owners");
  revalidatePath(`/owners/${id}`);
  revalidatePath("/dashboard");
  return null;
}

export async function approveOwnerAction(
  _prev: OwnerActionState,
  formData: FormData,
): Promise<OwnerActionState> {
  return updateOwnerStatus(
    formData,
    OwnerStatus.VERIFIED,
    [OwnerStatus.PENDING, OwnerStatus.SUSPENDED, OwnerStatus.REJECTED],
    "approve",
  );
}

export async function suspendOwnerAction(
  _prev: OwnerActionState,
  formData: FormData,
): Promise<OwnerActionState> {
  return updateOwnerStatus(
    formData,
    OwnerStatus.SUSPENDED,
    [OwnerStatus.VERIFIED, OwnerStatus.PENDING],
    "suspend",
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Edit owner — profile fields only. Email is intentionally not editable to
// avoid drift from Supabase Auth for hosts who self-signed up. Status
// transitions go through approve/suspend actions above.
// ─────────────────────────────────────────────────────────────────────────

const UpdateOwnerSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  contactNumber: z.string().trim().min(1, "Contact number is required"),
  address: z.string().trim().min(1, "Address is required"),
  bankDetails: z.string().trim().optional().or(z.literal("")),
  remarks: z.string().trim().optional().or(z.literal("")),
});

export async function updateOwnerAction(
  _prev: OwnerActionState,
  formData: FormData,
): Promise<OwnerActionState> {
  const admin = await requireAdmin();

  const id = String(formData.get("ownerId") ?? "").trim();
  if (!id) {
    return { error: "Missing owner id." };
  }

  const existing = await db.owner.findUnique({ where: { id } });
  if (!existing) {
    return { error: "Owner not found." };
  }

  const parsed = UpdateOwnerSchema.safeParse({
    fullName: formData.get("fullName"),
    contactNumber: formData.get("contactNumber"),
    address: formData.get("address"),
    bankDetails: formData.get("bankDetails"),
    remarks: formData.get("remarks"),
  });
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const changes: string[] = [];
  if (existing.fullName !== data.fullName) changes.push("fullName");
  if (existing.contactNumber !== data.contactNumber) changes.push("contactNumber");
  if (existing.address !== data.address) changes.push("address");
  if ((existing.bankDetails ?? "") !== (data.bankDetails ?? "")) changes.push("bankDetails");
  if ((existing.remarks ?? "") !== (data.remarks ?? "")) changes.push("remarks");

  await db.owner.update({
    where: { id },
    data: {
      fullName: data.fullName,
      contactNumber: data.contactNumber,
      address: data.address,
      bankDetails: data.bankDetails || null,
      remarks: data.remarks || null,
    },
  });

  if (changes.length > 0) {
    await db.activityLogEntry.create({
      data: {
        action: "OWNER_UPDATED",
        description: `Admin ${admin.email} updated owner ${existing.fullName} (${existing.email}). Fields changed: ${changes.join(", ")}`,
        type: "owner",
      },
    });
  }

  revalidatePath("/owners");
  revalidatePath(`/owners/${id}`);
  redirect(`/owners/${id}`);
}

// ─────────────────────────────────────────────────────────────────────────
// Document upload — ID + driver's license. Uses the service-role Supabase
// client so admins can upload on behalf of any owner. Files land in the
// private `owner-documents` bucket at `/{ownerId}/{docKind}.{ext}`.
// ─────────────────────────────────────────────────────────────────────────

type DocKind = "id" | "license";

const DOC_FIELD_MAP: Record<DocKind, "idDocumentUrl" | "licenseDocumentUrl"> = {
  id: "idDocumentUrl",
  license: "licenseDocumentUrl",
};

export async function uploadOwnerDocumentAction(
  _prev: OwnerActionState,
  formData: FormData,
): Promise<OwnerActionState> {
  const admin = await requireAdmin();

  const ownerId = String(formData.get("ownerId") ?? "").trim();
  const docKindRaw = String(formData.get("docKind") ?? "").trim();
  const file = formData.get("file");

  if (!ownerId) return { error: "Missing owner id." };
  if (docKindRaw !== "id" && docKindRaw !== "license") {
    return { error: "Invalid document kind." };
  }
  const docKind = docKindRaw as DocKind;

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

  const owner = await db.owner.findUnique({ where: { id: ownerId } });
  if (!owner) return { error: "Owner not found." };

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

  const field = DOC_FIELD_MAP[docKind];
  await db.owner.update({
    where: { id: ownerId },
    data: { [field]: objectPath },
  });

  await db.activityLogEntry.create({
    data: {
      action: docKind === "id" ? "OWNER_ID_UPLOADED" : "OWNER_LICENSE_UPLOADED",
      description: `Admin ${admin.email} uploaded ${docKind === "id" ? "government ID" : "driver's license"} for owner ${owner.fullName} (${owner.email})`,
      type: "owner",
    },
  });

  revalidatePath(`/owners/${ownerId}`);
  revalidatePath(`/owners/${ownerId}/edit`);
  return null;
}
