/**
 * FAZ6_PLAN.md §Faz 1.1 — LLM çağrılarında zaman bütçesi.
 *
 * İki ayrı katman var ve ikisi de gerekli:
 *  - **Çağrı başına timeout** (`llmTimeoutMs`): tek bir HTTP isteği asılırsa kesilir.
 *    Sağlayıcıların içinde `AbortSignal.timeout` ile uygulanır.
 *  - **Operasyon başına bütçe** (`analyzeDeadlineMs` / `debateDeadlineMs`): `analyst.ts`
 *    guard-retry döngüsü 4 çağrı, `debate.ts` 7 tur × 2 deneme yapabiliyor. Çağrı başına
 *    90sn'lik tavan bile sinyal başına ~6dk, tartışma başına ~21dk eder. Tartışma artık
 *    tick'in kritik hattında (Yorumcu kapısı) olduğu için toplam süre de sınırlanmalı.
 */

/** Tek LLM HTTP çağrısı için tavan. */
export function llmTimeoutMs(): number {
  return Number(process.env["LLM_TIMEOUT_MS"] ?? "90000");
}

/** Bir sinyalin tüm analiz döngüsü (guard retry'ları dahil) için tavan. */
export function analyzeDeadlineMs(): number {
  return Number(process.env["ANALYZE_DEADLINE_MS"] ?? "240000");
}

/** Bir tartışmanın tüm turları + moderatör için tavan. */
export function debateDeadlineMs(): number {
  return Number(process.env["DEBATE_DEADLINE_MS"] ?? "300000");
}

/**
 * Bir operasyonun bitiş anını taşır. `check()` bütçe aşıldıysa fırlatır — döngülerin
 * başında çağrılır, böylece yarım kalmış sonuç ASLA yazılmaz (bkz. debate.ts: kısmi
 * transkript `debates` tablosuna gitmemeli).
 */
export class Deadline {
  private readonly at: number;
  constructor(
    budgetMs: number,
    private readonly label: string,
  ) {
    this.at = Date.now() + budgetMs;
    this.budgetMs = budgetMs;
  }
  private readonly budgetMs: number;

  remaining(): number {
    return this.at - Date.now();
  }

  expired(): boolean {
    return this.remaining() <= 0;
  }

  /** Bütçe dolduysa fırlat. `extra` varsa mesaja iliştirilir (son ihlal/tur bilgisi). */
  check(extra?: string): void {
    if (!this.expired()) return;
    throw new Error(
      `${this.label}: süre bütçesi aşıldı (${Math.round(this.budgetMs / 1000)}sn)` +
        (extra ? ` — ${extra}` : ""),
    );
  }
}

/** Abort/timeout kaynaklı hatayı ayırt et — çıplak `AbortError` log'da kota hatasından ayrılamıyordu. */
export function isTimeoutError(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  return e.name === "AbortError" || e.name === "TimeoutError" || /aborted|timeout/i.test(e.message);
}

/** Sağlayıcıların ortak timeout mesajı — log'da greplenebilir tek biçim. */
export function timeoutError(provider: string, model: string, ms: number): Error {
  return new Error(`${provider}: ${Math.round(ms / 1000)}sn zaman aşımı (model=${model})`);
}
