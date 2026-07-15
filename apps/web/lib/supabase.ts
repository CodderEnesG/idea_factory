import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Server-side Supabase (service-role). Env yoksa null → UI demo moduna düşer. */
export function serverDb(): SupabaseClient | null {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
