"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { CUSTOMER_DOCUMENTS_BUCKET } from "@/lib/customer-documents";

const MAX_DOC_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_DOC_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export type CustomerProfileActionState =
  | {
      error: string;
      fieldErrors?: Record<string, string[] | undefined>;
    }
  | { saved: true }
  | null;

async function requireCustomer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    throw new Error("Not authenticated");
  }
  const customer = await db.customer.findUnique({ where: { email: user.email } });
  if (!customer) {
    throw new Error("This account is not set up as a customer account.");
  }
  return customer;
}

// Tier 19 — customer-side self-service document upload. Mirrors the host
// upload action shape but auths as the customer themselves. Both ID and
// driver's license are required for customers (cross-cutting decision #2).
// Files land in the private `customer-documents` bucket at
// `/{customerId}/{docKind}.{ext}`.

type CustomerDocKind = "id" | "license";

const CUSTOMER_DOC_FIELD_MAP: Record<
  CustomerDocKind,
  "idDocumentUrl" | "licenseDocumentUrl"
> = {
  id: "idDocumentUrl",
  license: "licenseDocumentUrl",
};

const CUSTOMER_DOC_LABEL_MAP: Record<CustomerDocKind, string> = {
  id: "government ID",
  license: "driver's license",
};

const CUSTOMER_DOC_ACTIVITY_MAP: Record<CustomerDocKind, string> = {
  id: "CUSTOMER_ID_UPLOADED",
  license: "CUSTOMER_LICENSE_UPLOADED",
};

export async function uploadCustomerDocumentAction(
  _prev: CustomerProfileActionState,
  formData: FormData,
): Promise<CustomerProfileActionState> {
  let customer: Awaited<ReturnType<typeof requireCustomer>>;
  try {
    customer = await requireCustomer();
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Authentication required.",
    };
  }

  const docKindRaw = String(formData.get("docKind") ?? "").trim();
  const file = formData.get("file");

  if (docKindRaw !== "id" && docKindRaw !== "license") {
    return { error: "Invalid document kind." };
  }
  const docKind = docKindRaw as CustomerDocKind;

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
  const objectPath = `${customer.id}/${docKind}.${extension}`;

  const supabase = createAdminClient();
  const { error: uploadError } = await supabase.storage
    .from(CUSTOMER_DOCUMENTS_BUCKET)
    .upload(objectPath, file, {
      upsert: true,
      contentType: file.type,
    });
  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  const field = CUSTOMER_DOC_FIELD_MAP[docKind];
  await db.customer.update({
    where: { id: customer.id },
    data: { [field]: objectPath },
  });

  await db.activityLogEntry.create({
    data: {
      action: CUSTOMER_DOC_ACTIVITY_MAP[docKind],
      description: `Customer ${customer.email} uploaded their ${CUSTOMER_DOC_LABEL_MAP[docKind]}`,
      type: "customer",
    },
  });

  revalidatePath("/account");
  revalidatePath("/account/verification");
  revalidatePath(`/customers/${customer.id}`);
  return { saved: true };
}
