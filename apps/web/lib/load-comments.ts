import { serverDb } from "./supabase";
import type { Comment } from "../components/Comments";

/** Sinyal başına yorum thread'i (eskiden yeniye). Kuyruk + Panom paylaşır. */
export async function loadComments(): Promise<Map<string, Comment[]>> {
  const db = serverDb();
  const map = new Map<string, Comment[]>();
  if (!db) return map;
  const { data, error } = await db
    .from("comments")
    .select("id, signal_id, author, body, created_at")
    .order("created_at", { ascending: true });
  if (error || !data) return map;
  for (const row of data as (Comment & { signal_id: string })[]) {
    const { signal_id, ...c } = row;
    const arr = map.get(signal_id) ?? [];
    arr.push(c);
    map.set(signal_id, arr);
  }
  return map;
}
