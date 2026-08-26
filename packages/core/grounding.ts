import { createGeminiClient } from "./providers/gemini.js";
import type { Signal } from "./signal.js";
import type { Lens } from "./lenses.config.js";
import type { StoredEnrichment } from "./enrichment.js";

/**
 * Canlı web araması (grounding) — analizden ÖNCE, şemasız serbest bir ön-çağrı. Sonucu asıl
 * yapılandırılmış analiz prompt'una düz metin olarak eklenir; analiz çağrısının kendi
 * şema/guard/provider mekanizması DEĞİŞMEDEN kalır (responseSchema modu ile googleSearch
 * tool'u aynı istekte birleşemiyor — bkz. providers/gemini.ts üstündeki not).
 *
 * 2026-08-26 yeniden tasarımı (FAZ6_PLAN.md §Faz 4.2). Eski hâli tek Türkçe sorguydu ve
 * sorguyu YALNIZ `signal.title`'dan kuruyordu. Başlıklar marka adıdır ("Skippr AI") — ABD
 * markası üstünde Türkçe arama kaynak makaleyi döndürür, kategorinin Türkiye'deki rakiplerini
 * değil. Beyaz-alan analizlerinin %66'sının `confidence: low` olmasının en olası sebebi buydu.
 * Şimdi: kategori ifadesi + 3 paralel hedefli sorgu (TR/TR-EN/momentum) + gerçek kaynak URL'leri.
 *
 * Hangi merceğin arama istediği artık burada sabit bir id listesi DEĞİL, `lenses.grounding`
 * kolonundan gelen mercek özelliği (`Lens.grounding`). `GROUNDING_ENABLED` global kill-switch
 * olarak kalır.
 */

/** Global kill-switch — mercek `grounding: true` olsa bile bu kapalıysa hiç arama yapılmaz. */
export function groundingEnabled(): boolean {
  return process.env["GROUNDING_ENABLED"] === "true";
}

/** Bu analiz için arama yapılacak mı: mercek istiyor VE global anahtar açık. */
export function shouldGround(lens: Pick<Lens, "grounding">): boolean {
  return lens.grounding === true && groundingEnabled();
}

/**
 * Sorguların dayanacağı KATEGORİ ifadesi. Marka adı yerine "ne iş yapıyor"a yaklaşır —
 * arama sonucu kaynak makaleye değil sektöre gitsin diye.
 */
export function categoryPhrase(signal: Signal, enrichment?: StoredEnrichment | null): string {
  const parts: string[] = [];
  const summary = enrichment?.project_summary?.trim();
  if (summary) parts.push(summary.slice(0, 180));
  if (signal.sector) parts.push(signal.sector);
  if (parts.length === 0) parts.push(signal.title);
  return parts.join(" — ");
}

/** Üç hedefli sorgu: TR (Türkçe), TR/MENA (İngilizce), fonlama momentumu. */
export function buildGroundingQueries(signal: Signal, category: string): string[] {
  const common =
    `Bulduğun her oyuncu için TEK satır yaz: "isim — bir cümle ne yaptığı — url". ` +
    `Kaynak URL'si olmayan iddia yazma. Hiçbir şey bulamazsan tek satır "BULUNAMADI" yaz — uydurma.`;
  return [
    `Türkiye pazarı taraması. Kategori: ${category}. ` +
      `Bu problemi Türkiye'de çözen girişim/ürün/platform var mı? Kim, hangi olgunlukta ` +
      `(erken / büyümüş / hakim oyuncu)? ${common}`,
    `Regional competitor scan (answer in Turkish). Category: ${category}. ` +
      `Which startups or incumbents serve this need in Turkey and the MENA region? ` +
      `Include local incumbents that solve it as a side feature. ${common}`,
    `Rekabet momentumu. Kategori: ${category}. Son 12 ayda Türkiye veya MENA'da bu alanda ` +
      `yatırım turu / yeni girişim / büyük oyuncu hamlesi oldu mu — boşluk kapanıyor mu? ` +
      `(referans: "${signal.title}") ${common}`,
  ];
}

/** Yanıttaki gerçek arama kaynaklarını çıkar — modelin URL'yi doğru yeniden yazmasına güvenme. */
function extractSources(res: unknown): string[] {
  const chunks = (
    res as {
      candidates?: { groundingMetadata?: { groundingChunks?: { web?: { uri?: string; title?: string } }[] } }[];
    }
  )?.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (!Array.isArray(chunks)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of chunks) {
    const uri = c?.web?.uri;
    if (!uri || seen.has(uri)) continue;
    seen.add(uri);
    out.push(c.web?.title ? `${c.web.title} — ${uri}` : uri);
  }
  return out.slice(0, 12);
}

export interface Grounder {
  (signal: Signal, lens: Pick<Lens, "grounding">, enrichment?: StoredEnrichment | null): Promise<
    string | null
  >;
}

/**
 * Asla fırlatmaz. Ama artık `null` yalnız "bu mercek arama istemiyor" demek — arama YAPILIP
 * bir şey bulunamaması ve aramanın BAŞARISIZ olması ayrı ayrı metin döner. Bu ayrım beyaz-alan
 * merceği için kritik: 1. sorusu zaten "'kimse yapmıyor' tek başına olumlu kanıt DEĞİLDİR"
 * diyor — model, sessiz bir boşluğu "rakip yok, harika" diye okuyabiliyordu.
 */
export async function groundSignal(
  signal: Signal,
  lens: Pick<Lens, "grounding">,
  enrichment?: StoredEnrichment | null,
): Promise<string | null> {
  if (!shouldGround(lens)) return null;

  const model = process.env["GROUNDING_MODEL"] ?? process.env["GEMINI_MODEL"] ?? "gemini-3.5-flash";
  // Sorgular paralel — duvar saati ~1× timeout, 3× değil.
  const timeoutMs = Number(process.env["GROUNDING_TIMEOUT_MS"] ?? "30000");
  const maxQueries = Number(process.env["GROUNDING_QUERIES"] ?? "3");
  const category = categoryPhrase(signal, enrichment);
  const queries = buildGroundingQueries(signal, category).slice(0, Math.max(1, maxQueries));

  let ai;
  try {
    ai = createGeminiClient();
  } catch (e) {
    console.error(`grounding istemcisi kurulamadı (${signal.url}):`, e instanceof Error ? e.message : e);
    return searchFailedBlock(queries.length);
  }

  const settled = await Promise.allSettled(
    queries.map(async (q) => {
      const res = await ai!.models.generateContent({
        model,
        contents: q,
        config: { tools: [{ googleSearch: {} }], abortSignal: AbortSignal.timeout(timeoutMs) },
      });
      return { text: (res.text ?? "").trim(), sources: extractSources(res) };
    }),
  );

  const blocks: string[] = [];
  const sources = new Set<string>();
  let okCount = 0;
  let foundCount = 0;
  settled.forEach((r, i) => {
    if (r.status !== "fulfilled") {
      console.error(
        `grounding sorgusu ${i + 1} başarısız (${signal.url}):`,
        r.reason instanceof Error ? r.reason.message : r.reason,
      );
      return;
    }
    okCount++;
    const text = r.value.text;
    r.value.sources.forEach((s) => sources.add(s));
    if (!text) return;
    if (/^BULUNAMADI\s*$/i.test(text)) return;
    foundCount++;
    blocks.push(`(${i + 1}) ${text}`);
  });

  if (okCount === 0) return searchFailedBlock(queries.length);
  if (foundCount === 0) return nothingFoundBlock(okCount);

  const srcBlock =
    sources.size > 0 ? `\n\nArama kaynakları (gerçek, atıf için kullan):\n- ${[...sources].join("\n- ")}` : "";
  return (
    `Canlı arama yapıldı (${okCount}/${queries.length} sorgu başarılı). Bulgular:\n` +
    blocks.join("\n") +
    srcBlock
  );
}

/** Arandı ama eşleşme yok — bu OLUMLU kanıt değildir, mercek kuralı bunu açıkça istiyor. */
function nothingFoundBlock(okCount: number): string {
  return (
    `Canlı arama yapıldı (${okCount} sorgu: TR taraması, TR/MENA taraması, fonlama momentumu). ` +
    `TR/MENA'da eşleşen oyuncu BULUNAMADI. Bu tek başına OLUMLU kanıt DEĞİLDİR — boşluğun ` +
    `nedenini (talep yokluğu mu = kötü boşluk, fark edilmemiş fırsat mı = iyi boşluk) ayrıca ` +
    `gerekçelendir ve confidence'ı buna göre ver.`
  );
}

/** Arama hiç yapılamadı — modelin bunu "rakip yok" diye okumasını açıkça yasakla. */
function searchFailedBlock(queryCount: number): string {
  return (
    `Canlı arama YAPILAMADI (${queryCount} sorgunun tamamı hata/zaman aşımı). Rekabet ortamı ` +
    `hakkında arama kanıtı YOK — buna dayanarak "boşluk var" iddia etme; confidence'ı düşük tut.`
  );
}
