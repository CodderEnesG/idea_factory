import { WebSocket as WsWebSocket } from "ws";
import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

// supabase-js realtime, native WebSocket ister; Node <22'de yok. Polyfill.
// (realtime kullanmıyoruz ama client eager init ediyor.)
if (!(globalThis as { WebSocket?: unknown }).WebSocket) {
  (globalThis as { WebSocket?: unknown }).WebSocket = WsWebSocket;
}

/** Service-role Supabase client (worker tarafı — RLS bypass). */
export const db = createClient(env.supabaseUrl(), env.supabaseServiceKey(), {
  auth: { persistSession: false },
});
