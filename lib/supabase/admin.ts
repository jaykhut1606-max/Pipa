// Server-only Supabase client using the service-role key. Bypasses RLS.
// NEVER import this from a Client Component or any file that ships to the
// browser — the service-role key must stay on the server.
//
// The presence of SUPABASE_SERVICE_ROLE_KEY is the trigger for "real DB
// mode": when it's set, the dual-mode adapters in lib/data/* write to
// Supabase. When it's missing, they fall back to the in-memory demo stores
// in lib/scan-store.ts and lib/event-store.ts.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// We don't ship generated DB types yet, so the schema is left as the
// permissive default. Once we generate types from the project schema,
// swap `SupabaseClient` for `SupabaseClient<Database>`.
let _admin: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient | null {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _admin = createClient(url, key, { auth: { persistSession: false } });
  return _admin;
}

export function isSupabaseEnabled(): boolean {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}
