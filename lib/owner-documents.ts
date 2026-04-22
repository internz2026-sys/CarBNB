import "server-only";
import { createAdminClient } from "@/utils/supabase/admin";

export const OWNER_DOCUMENTS_BUCKET = "owner-documents";

// Resolve a private-bucket storage path to a short-lived signed URL that
// server components can hand to the browser. Returns null if no path stored
// or the URL could not be generated.
export async function getOwnerDocumentSignedUrl(
  path: string | null | undefined,
): Promise<string | null> {
  if (!path) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(OWNER_DOCUMENTS_BUCKET)
    .createSignedUrl(path, 60 * 60); // 1 hour
  if (error) return null;
  return data.signedUrl;
}
