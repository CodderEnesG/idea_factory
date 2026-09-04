import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * "Kovala" kararı verilince boş bir checklist yerine düzenlenebilir bir başlangıç noktası
 * (problem 3: "adım atma yönü güçsüz").
 *
 * 2026-08-26 (FAZ6_PLAN.md §Faz 6.4): şablon artık SON çare. Analistin kendi
 * `validation_needed` maddeleri varsa onlar kullanılır — guard (d) (`guards.ts:56-58`)
 * analisti 3'e kadar somut `{data, why, how_to_verify}` üretmeye zaten ZORLUYOR ve bunlar
 * kartta salt-okunur duruyordu. Kovalamayı haklı çıkaran analizin kendi eksikleri, jenerik
 * üç cümleden kesinlikle daha iyi bir başlangıç checklist'i.
 */
export const PURSUE_STARTER_TASKS: readonly string[] = [
  "Kurucuya/ekibe ulaş",
  "Rakip ve pazar taraması yap",
  "Fiyatlandırma & TAM notu çıkar",
];

export interface ValidationLike {
  data: string;
  why?: string;
  how_to_verify?: string;
}

/** Bir doğrulama maddesini görev metnine çevirir (UI'daki "+ Göreve ekle" ile aynı biçim). */
export function validationToTaskBody(v: ValidationLike): string {
  const how = typeof v.how_to_verify === "string" ? v.how_to_verify.trim() : "";
  return how ? `${v.data} — ${how}` : v.data;
}

/**
 * Analizden başlangıç görevleri; `validation_needed` yoksa jenerik şablona düşer.
 *
 * Girdi DB'den gelen ham JSONB — şema garantisi YOK (eski satırlar guard (d) eklenmeden önce
 * yazıldı, ve kolon elle de düzenlenebilir). Dizi değilse ya da maddeler bozuksa şablona
 * düşülür: kullanıcı "Kovala" bastığında 500 almamalı, karar zaten yazılmış oluyor.
 */
export function starterTasksFor(validationNeeded: unknown): string[] {
  if (!Array.isArray(validationNeeded)) return [...PURSUE_STARTER_TASKS];
  const bodies = validationNeeded
    .filter((v): v is ValidationLike => !!v && typeof v === "object" && typeof (v as ValidationLike).data === "string" && (v as ValidationLike).data.trim() !== "")
    .map(validationToTaskBody);
  return bodies.length > 0 ? bodies : [...PURSUE_STARTER_TASKS];
}

/**
 * "Kovala" ilk kez seçilince başlangıç görevlerini ekler.
 *
 * **Kontrol sinyal bazında, sahip bazında DEĞİL** (FAZ6_PLAN.md §Faz 6.1 zorunlu düzeltmesi).
 * Görev listesi ekipçe ortaklaştıktan sonra `.eq("owner", …)` kontrolü, Kovala'ya basan
 * İKİNCİ kişinin aynı 3 görevi aynı listeye tekrar tohumlamasına yol açardı.
 */
export async function seedStarterTasks(
  db: SupabaseClient,
  signalId: string,
  owner: string,
): Promise<void> {
  const { count } = await db
    .from("item_tasks")
    .select("id", { count: "exact", head: true })
    .eq("signal_id", signalId);
  if (count) return; // listede zaten bir şey var — spam etme

  // En yüksek fit'li analizin doğrulama maddelerini kullan (yoksa şablon).
  const { data: rows } = await db
    .from("analyses")
    .select("validation_needed, fit")
    .eq("signal_id", signalId)
    .order("fit", { ascending: false })
    .limit(1);
  const bodies = starterTasksFor((rows?.[0] as { validation_needed?: unknown } | undefined)?.validation_needed);
  await db
    .from("item_tasks")
    .insert(bodies.map((body) => ({ signal_id: signalId, owner, body })));
}
