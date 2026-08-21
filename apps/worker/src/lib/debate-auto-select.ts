export interface DecisionLogRow {
  signal_id: string;
  decision: string;
  decided_by: string | null;
  created_at: string;
}

/**
 * decisions log'undan hangi sinyaller için otomatik AI Yorumcusu tetiklenmeli seçer (madde 3-A,
 * 2026-08-21 kararı: tam otomasyon değil, yalnız kişisel "Kovala" kararı tetikler). Kural: en az
 * bir kullanıcının EN SON kişisel kararı "pursue" olmalı VE bu sinyal için henüz hiç debate
 * yazılmamış olmalı (idempotent — aynı sinyal tekrar tekrar tartışılmaz, admin isterse mevcut
 * admin-endpoint'iyle elle yeniden tetikleyebilir).
 *
 * `decisions` append-only bir log — `decisions` PARAMETRESİ ÇAĞIRAN TARAFINDAN created_at DESC
 * sıralı verilmelidir (apps/web/lib/load-decisions.ts ile aynı dedupe kuralı; web ve worker ayrı
 * supabase client'ları kullandığı için kod paylaşılamıyor, mantık burada tekrarlanıyor).
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
