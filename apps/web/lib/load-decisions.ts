import { serverDb } from "./supabase";
import type { Decision, UserDecision } from "../components/DecisionButtons";

/**
 * Sinyal başına TÜM kullanıcıların en son kararı. decisions bir log; en-yeniden geriye okuyup
 * (signal_id, decided_by) başına ilk görüleni (=en yeni) alıyoruz. İşbirlikçi: her kullanıcının
 * kendi kararı ayrı yaşar, kimse diğerini ezmez. Kuyruk + Panom paylaşır.
 */
export async function loadDecisions(): Promise<Map<string, UserDecision[]>> {
  const db = serverDb();
  const map = new Map<string, UserDecision[]>();
  if (!db) return map;
  const { data, error } = await db
    .from("decisions")
    .select("signal_id, decision, decided_by, created_at")
    .order("created_at", { ascending: false });
  if (error || !data) return map;
  const seen = new Set<string>(); // `${signal_id}|${user}`
  for (const row of data as { signal_id: string; decision: Decision; decided_by: string | null }[]) {
    const user = row.decided_by ?? "web";
    const key = `${row.signal_id}|${user}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const arr = map.get(row.signal_id) ?? [];
    arr.push({ user, decision: row.decision });
    map.set(row.signal_id, arr);
  }
  return map;
}
