import "server-only";
import { createAdminClient } from "@/utils/supabase/admin";

const CAR_DOCUMENTS_BUCKET = "car-documents";
const ONE_HOUR = 60 * 60;

// OR/CR lives in a private bucket; generate a short-lived signed URL whenever
// the admin wants to view it. Never store signed URLs — they expire.
export async function getListingDocumentSignedUrl(
  path: string | null,
): Promise<string | null> {
  if (!path) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(CAR_DOCUMENTS_BUCKET)
    .createSignedUrl(path, ONE_HOUR);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
