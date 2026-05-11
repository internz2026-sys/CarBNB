import "server-only";
import { createAdminClient } from "@/utils/supabase/admin";

export const CUSTOMER_DOCUMENTS_BUCKET = "customer-documents";

// Resolve a private-bucket storage path to a short-lived signed URL that
// server components can hand to the browser. Mirrors lib/owner-documents.ts
// but for customer ID + driver's license uploads. Returns null if no path
// stored or the URL could not be generated.
export async function getCustomerDocumentSignedUrl(
  path: string | null | undefined,
): Promise<string | null> {
  if (!path) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(CUSTOMER_DOCUMENTS_BUCKET)
    .createSignedUrl(path, 60 * 60); // 1 hour
  if (error) return null;
  return data.signedUrl;
}
