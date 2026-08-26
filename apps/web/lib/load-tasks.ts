import { serverDb } from "./supabase";
import type { TaskItem } from "../components/TaskList";

/**
 * Sinyal başına görev listesi (eskiden yeniye) — **ekipçe görünür** (FAZ6_PLAN.md §Faz 6.1).
 *
 * Eskiden `.eq("owner", meName)` ile kişiye özeldi: takım arkadaşınız sizin checklist'inizi
 * göremiyor, üstlenemiyor, tamamlayamıyordu; Panom'daki "görev x/y" rozeti de yalnız kendi
 * görevlerinizi sayıyordu, yani Kovala sütunu ekipçe her zaman boş görünüyordu. Kovala
 * kilitlenip gerçekten geliştirmeye başlanacaksa "kim ne yapıyor" görünmek zorunda.
 *
 * `owner` artık satırla birlikte dönüyor — UI kimin eklediğini gösteriyor.
 */
export async function loadTasks(): Promise<Map<string, TaskItem[]>> {
  const db = serverDb();
  const map = new Map<string, TaskItem[]>();
  if (!db) return map;
  const { data, error } = await db
    .from("item_tasks")
    .select("id, signal_id, body, done, owner, created_at")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[load-tasks] sorgu hatası:", error.message);
    return map;
  }
  if (!data) return map;
  for (const row of data as (TaskItem & { signal_id: string })[]) {
    const { signal_id, ...t } = row;
    const arr = map.get(signal_id) ?? [];
    arr.push(t);
    map.set(signal_id, arr);
  }
  return map;
}
