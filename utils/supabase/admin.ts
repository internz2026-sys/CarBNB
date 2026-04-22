import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client using the service role key. Bypasses Row Level
// Security — never import this into client components. Use it from server
// actions and route handlers that have already confirmed the caller is an
// admin via our own DB check (see requireAdmin in app/actions/owners.ts).
export const createAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
