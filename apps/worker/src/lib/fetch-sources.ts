import type { Signal } from "@idea-factory/core";
import type { Source } from "../sources/types.js";
import { limitPerSource } from "./limit-per-source.js";

export interface FetchAllResult {
  signals: Signal[];
  /**
   * Hatasız TAMAMLANAN kaynak sayısı — satır sayısına BAKILMAZ. Sağlıklı ama o gün haber
   * üretmemiş bir feed başarısızlık DEĞİLDİR; yalnız `fetch()` fırlatan kaynak sayılmaz.
   * `ingest.ts` bunu "toplu başarısızlık" guard'ı için okuyor (FAZ6_PLAN.md §Faz 1.3).
   */
  okSources: number;
  failedSources: string[];
}

/**
 * Sabit boyutlu havuz (bkz. backfill-lens.ts): `concurrency` kadar kaynak aynı anda çeker.
 * concurrency=1 → eskisiyle birebir aynı, sıralı davranış. Bir kaynağın patlaması diğerlerini
 * düşürmez.
 *
 * `ingest.ts` içindeydi; oradan çıkarıldı çünkü `ingest.ts` import edilir edilmez `main()`
 * koşuyor — yani toplu-başarısızlık guard'ı test edilemiyordu. Guard'ın kendisi tam da
 * "sessizce yanlış çalışma" sınıfından bir hatayı kapatıyor, testsiz bırakılamaz.
 */
export async function fetchAllSources(
  sources: Source[],
  settings: { per_source_limit: number; concurrency: number },
): Promise<FetchAllResult> {
  let collected: Signal[] = [];
  let okSources = 0;
  const failedSources: string[] = [];
  let next = 0;
  const worker = async (): Promise<void> => {
    for (;;) {
      const i = next++;
      if (i >= sources.length) return;
      const src = sources[i];
      if (!src) return;
      try {
        const rows = limitPerSource(await src.fetch(), settings.per_source_limit);
        console.log(`[${src.name}] ${rows.length} sinyal çekildi`);
        collected = collected.concat(rows);
        okSources++;
      } catch (e) {
        failedSources.push(src.name);
        console.error(`[${src.name}] çekim hatası:`, e instanceof Error ? e.message : e);
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(settings.concurrency, sources.length) }, worker),
  );
  return { signals: collected, okSources, failedSources };
}
