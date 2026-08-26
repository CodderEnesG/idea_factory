import type { FitBand } from "@idea-factory/core";

export interface DecisionLogRow {
  signal_id: string;
  decision: string;
  decided_by: string | null;
  created_at: string;
}

/** Kompozit bandı hesaplanmış bir sinyal — kapı adayı seçimi bunun üstünden yürür. */
export interface GateCandidateRow {
  signal_id: string;
  band: FitBand;
  fit: number;
  /** En yeni analizin zaman damgası — taze adaylar önce tartışılsın. */
  ts: string;
}

/** Kapının kapanması için gereken bağımsız otomatik tur sayısı (bkz. card-view.ts'teki eşi). */
export const GATE_REQUIRED_DEBATES = 2;

/**
 * **Yorumcu kapısı** adayları (FAZ6_PLAN.md §Faz 2.4).
 *
 * Eskiden tartışma yalnız bir insan "Kovala" dedikten SONRA tetikleniyordu — yani en iyi
 * ayırt edici (Yorumcu'nun insanla uyumu %60, ham AI'ın %25), ayırt etmesi gereken andan
 * sonra çalışıyordu. Artık kompozit bandı `pursue` olan HER sinyal, insan görmeden önce iki
 * bağımsız tartışmadan geçer.
 *
 * `debateCount`: sinyal başına mevcut OTOMATİK tur sayısı (manuel/admin turları sayılmaz —
 * tek bir elle tetikleme kapıyı erken kapatmamalı).
 */
export function selectGateCandidates(
  rows: GateCandidateRow[],
  debateCount: ReadonlyMap<string, number>,
): string[] {
  const remaining = (id: string): number =>
    GATE_REQUIRED_DEBATES - (debateCount.get(id) ?? 0);
  return rows
    .filter((r) => r.band === "pursue" && remaining(r.signal_id) > 0)
    .sort((a, b) => {
      // 1) Tamamlanmaya EN YAKIN önce. Yarım kalmış bir kapı hiçbir işe yaramaz: sinyal
      //    "Yorumcu bekliyor"da asılı kalır. Bir turu eksik olanı bitirmek, yeni bir kapı
      //    açmaktan daha çok KAPALI kapı üretir — yani ekibe daha çok karar verilebilir kart.
      const rem = remaining(a.signal_id) - remaining(b.signal_id);
      if (rem !== 0) return rem;
      // 2) En yeni analiz önce, 3) yüksek fit önce.
      if (a.ts !== b.ts) return a.ts < b.ts ? 1 : -1;
      return b.fit - a.fit;
    })
    .map((r) => r.signal_id);
}

/**
 * İkincil tetikleyici — kapının DIŞINDA kalan sinyaller için (fit<80 ama bir insan yine de
 * "Kovala" demiş). Kapı bunları hiç seçmez ama insanın beğendiği bir sinyalde ikinci görüş
 * hâlâ değerli, o yüzden eski seçici korunuyor.
 *
 * Kural: en az bir kullanıcının EN SON kişisel kararı "pursue" olmalı VE bu sinyal için
 * henüz hiç tartışma yazılmamış olmalı.
 *
 * `decisions` PARAMETRESİ ÇAĞIRAN TARAFINDAN created_at DESC sıralı verilmelidir
 * (apps/web/lib/load-decisions.ts ile aynı dedupe kuralı; web ve worker ayrı supabase
 * client'ları kullandığı için kod paylaşılamıyor, mantık burada tekrarlanıyor).
 */
export function selectAutoDebateCandidates(
  decisions: DecisionLogRow[],
  alreadyDebated: ReadonlySet<string>,
): string[] {
  const seenUser = new Set<string>(); // `${signal_id}|${user}` — bu kullanıcı için en yeni karar zaten görüldü mü
  const pursueAt = new Map<string, string>(); // signal_id -> en yeni "pursue" kararının created_at'i

  for (const row of decisions) {
    const user = row.decided_by ?? "web";
    const key = `${row.signal_id}|${user}`;
    if (seenUser.has(key)) continue;
    seenUser.add(key);
    if (row.decision === "pursue" && !pursueAt.has(row.signal_id)) {
      pursueAt.set(row.signal_id, row.created_at);
    }
  }

  return [...pursueAt.entries()]
    .filter(([signalId]) => !alreadyDebated.has(signalId))
    .sort((a, b) => (a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0)) // en yeni pursue kararı önce
    .map(([signalId]) => signalId);
}
