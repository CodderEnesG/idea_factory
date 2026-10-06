/** backfill-lens/triage ile aynı sayfa boyu — PostgREST max-rows (5000) tavanının altında. */
export const PAGE = 1000;

type PageResult<T> = { data: T[] | null; error: { message: string } | null };

/**
 * Sayfasız `select` PostgREST max-rows tavanında SESSİZCE kesilir: analyses 9.4k satıra
 * çıkınca digest / source-weight / debate-auto tablonun rastgele 5000 satırını görüyordu
 * (2026-10-06). `page` her sayfa için yeniden çağrılır ve sorguyu `.range(from, to)` ile
 * bitirmeli; sayfalar arası kayma olmasın diye sorgu kararlı bir `.order(...)` içermeli.
 */
export async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<PageResult<T>>,
  errorPrefix: string,
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw new Error(`${errorPrefix}: ${error.message}`);
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < PAGE) return all;
  }
}
