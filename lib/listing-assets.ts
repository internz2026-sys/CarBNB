// Public URL builder for car-photos bucket. Safe to import from client
// components — only reads NEXT_PUBLIC_SUPABASE_URL, which is browser-exposed
// by design. Signed URLs for the private OR/CR document live in
// `lib/listing-documents.ts` (server-only).
const CAR_PHOTOS_BUCKET = "car-photos";

export function getCarPhotoPublicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  return `${base}/storage/v1/object/public/${CAR_PHOTOS_BUCKET}/${path}`;
}

// Photos can be: Supabase Storage paths (new uploads), absolute http URLs
// (external seeds), or local /public paths (seeded mock data). Resolve in
// one place so every view renders them correctly.
export function resolveListingPhotoUrl(path: string): string {
  if (path.startsWith("http") || path.startsWith("/")) return path;
  return getCarPhotoPublicUrl(path);
}
