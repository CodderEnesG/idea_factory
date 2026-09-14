/**
 * Yorumcu kapısında hangi tartışmalar "güncel" sayılır. 2026-09-14'te fit≥50 bandındaki tüm
 * sinyaller yeni zenginleştirme + guard (j)/(k) ile yeniden analiz edildi (reassess:2026-09c,
 * başlangıç 12:54 TR). Ondan önce yazılmış tartışmalar eski analize göre karar vermişti —
 * 48 AI-kovala kartı o eski tartışmaların vetosuyla ele'de duruyordu.
 *
 * Kesimden önceki tartışmalar SİLİNMEZ (audit, kartta görünür) ama kapı sayımına ve
 * temkinli-kazanır kuralına katılmaz. Worker seçimi, web kart bandı ve kalibrasyon aynı
 * sabiti okur ki birbirinden kaymasınlar. Bir sonraki toplu yeniden analizde güncellenir.
 */
export const GATE_DEBATE_CUTOFF = "2026-09-14T09:54:00Z";

export function isGateDebateCurrent(createdAt: string): boolean {
  const t = Date.parse(createdAt);
  return !Number.isNaN(t) && t >= Date.parse(GATE_DEBATE_CUTOFF);
}
