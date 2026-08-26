import { serverDb } from "./supabase";
import type { DebateView } from "./card-view";
import { isMissingColumn } from "./pg-compat";

export interface DebatesResult {
  map: Map<string, DebateView[]>;
  /** Sorgu patladı — çağıran bunu "tartışma yok" ile karıştırmamalı (bkz. aşağıdaki not). */
  degraded: boolean;
}

/**
 * AI Yorumcusu sonuçları. İki değişiklik (FAZ6_PLAN.md §Faz 2.3):
 *
 * 1. **Artık admin-only DEĞİL.** `debates` tablosunda kişiye özel veri yok, yani admin
 *    kapısının gizlilik gerekçesi yoktu; ama Yorumcu artık kovala rozetini DÜŞÜREBİLİYOR
 *    (kapı) ve açıklanmayan bir veto, güven için vetosuzluktan daha kötü. Herkes neden
 *    düştüğünü görebilmeli. Tartışmayı TETİKLEMEK (7 LLM çağrısı) admin-only kalır.
 * 2. **`transcript` liste sorgusundan çıkarıldı** (admin için de). 260 × 7-tur transkript
 *    her `/queue` render'ında uygulamanın en büyük JSONB yüküydü; kart açılınca
 *    `/api/debates/[signalId]` ile lazy yükleniyor. Collapsed etiketteki "N tur" sayısı
 *    0014'ün `turn_count` generated kolonundan geliyor.
 *
 * Hata yutulmuyor: kapıdan sonra sessiz bir hata HER fit≥80 sinyali `pending`e (İzle)
 * çevirir ve kovala sütunu hiçbir açıklama olmadan boşalır. `degraded` bunu UI'a taşır.
 */
export async function loadDebates(): Promise<DebatesResult> {
  const map = new Map<string, DebateView[]>();
  const db = serverDb();
  if (!db) return { map, degraded: false }; // env yok = demo modu, hata değil
  const BASE = "id, signal_id, final_verdict, final_commentary, created_by, created_at";
  type Row = Omit<DebateView, "transcript"> & { signal_id: string; kind?: string | null };
  let res = (await db
    .from("debates")
    .select(`${BASE}, kind, run_no, turn_count`)
    .order("created_at", { ascending: false })) as {
    data: Row[] | null;
    error: { code?: string; message: string } | null;
  };

  // 0014 henüz uygulanmadıysa eski kolon setiyle devam et (bkz. pg-compat.ts).
  if (isMissingColumn(res.error)) {
    console.warn("[load-debates] 0014 uygulanmamış — kapı devre dışı, eski kolonlarla okunuyor");
    res = (await db.from("debates").select(BASE).order("created_at", { ascending: false })) as typeof res;
  }

  if (res.error) {
    console.error("[load-debates] sorgu hatası:", res.error.message);
    return { map, degraded: true };
  }
  if (!res.data) return { map, degraded: true };
  for (const row of res.data) {
    const { signal_id, ...d } = row;
    const arr = map.get(signal_id) ?? [];
    // `kind` yoksa (0014 öncesi) satırı 'manual' say: kapı hiç kapanmaz ama tartışma yine
    // temkinli-kazanır kuralına girer, yani kimse yanlışlıkla Kovala görmez.
    arr.push({ ...d, transcript: null, kind: d.kind ?? "manual", run_no: d.run_no ?? null, turn_count: d.turn_count ?? null });
    map.set(signal_id, arr);
  }
  return { map, degraded: false };
}
