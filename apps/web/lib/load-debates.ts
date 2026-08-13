import { serverDb } from "./supabase";
import type { DebateView } from "./card-view";

/** AI Yorumcusu transkriptleri — admin-only, `isAdmin` false ise boş harita döner (gereksiz sorgu yok). Kuyruk + Panom paylaşır. */
export async function loadDebates(isAdmin: boolean): Promise<Map<string, DebateView[]>> {
  const map = new Map<string, DebateView[]>();
  if (!isAdmin) return map;
  const db = serverDb();
  if (!db) return map;
  const { data, error } = await db
    .from("debates")
    .select("id, signal_id, transcript, final_verdict, final_commentary, created_by, created_at")
    .order("created_at", { ascending: false });
  if (error || !data) return map;
  for (const row of data as (DebateView & { signal_id: string })[]) {
    const { signal_id, ...d } = row;
    const arr = map.get(signal_id) ?? [];
    arr.push(d);
    map.set(signal_id, arr);
  }
  return map;
}
