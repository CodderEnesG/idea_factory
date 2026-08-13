import { serverDb } from "./supabase";
import type { TaskItem } from "../components/TaskList";

/**
 * Oturum sahibinin sinyal başına görev listesi (eskiden yeniye). Kişisel bir checklist —
 * decisions'ın aksine ekip arkadaşlarının görevleri gösterilmez (henüz paylaşımlı değil).
 * Kuyruk + Panom paylaşır.
 */
export async function loadTasks(meName: string): Promise<Map<string, TaskItem[]>> {
  const db = serverDb();
  const map = new Map<string, TaskItem[]>();
  if (!db) return map;
  const { data, error } = await db
    .from("item_tasks")
    .select("id, signal_id, body, done, created_at")
    .eq("owner", meName)
    .order("created_at", { ascending: true });
  if (error || !data) return map;
  for (const row of data as (TaskItem & { signal_id: string })[]) {
    const { signal_id, ...t } = row;
    const arr = map.get(signal_id) ?? [];
    arr.push(t);
    map.set(signal_id, arr);
  }
  return map;
}
