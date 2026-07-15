import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

/** Service-role Supabase client (worker tarafı — RLS bypass). */
export const db = createClient(env.supabaseUrl(), env.supabaseServiceKey(), {
  auth: { persistSession: false },
});
