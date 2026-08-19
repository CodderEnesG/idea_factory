import { createGeminiClient } from "./providers/gemini.js";
import type { Signal } from "./signal.js";

/**
 * PLAN.md §11 madde 2 — kademeli model + grounding'in "grounding" yarısı. Yalnız rekabet
 * ortamı sorusu döndüğü belli merceklerde (arbitraj + beyaz-alan) — id sabit kalmalı
 * (bkz. lenses.config.ts üstündeki not), o yüzden burada da sabit id string'i kullanılıyor,
 * Lens/CustomLensDef'e alan eklemedik (admin-mercekleri de kapsayacak bir DB kolonu şu an
 * için pilot kapsamının dışında — kod incelemesi + tip kontrolü + küçük pilotla ölçmeden
 * genel bir özelliğe genişletmiyoruz, bkz. sohbet geçmişi 2026-08-19).
 */
const GROUNDED_LENS_IDS = new Set(["arbitrage", "white_space"]);

export function lensNeedsGrounding(lensId: string): boolean {
  return GROUNDED_LENS_IDS.has(lensId) && process.env["GROUNDING_ENABLED"] === "true";
}

/**
 * Serbest, şemasız bir ön-çağrı: modelin gerçek Google Search kullanmasına izin verir
 * (responseSchema modunda bu mümkün değil — bkz. providers/gemini.ts üstündeki not). Sonucu
 * asıl yapılandırılmış analiz promptuna düz metin olarak eklenir, analiz çağrısının kendi
 * şema/guard/provider mekanizması DEĞİŞMEDEN kalır.
 *
 * Asla fırlatmaz — grounding başarısız/kota/ağ hatası analiz adımını düşürmemeli, yalnız
 * o sinyal grounding'siz (eski davranış) analiz edilir.
 */
export async function groundSignal(signal: Signal): Promise<string | null> {
  try {
    const ai = createGeminiClient();
    const model = process.env["GROUNDING_MODEL"] ?? process.env["GEMINI_MODEL"] ?? "gemini-3.5-flash";
    // Timeout: 2026-08-19 pilotunda ~8 sinyal ard arda ağ kesintisiyle (ENOTFOUND) yavaşladı —
    // sınırsız bekleme, tick'i asıp cron'u kilitleyebilir. Grounding "en fazla N sn bekle,
    // olmazsa grounding'siz devam et" felsefesine uysun diye 20sn tavan (ana analiz çağrısının
    // kendi guard-retry döngüsü zaten dakikalar sürebiliyor — grounding onun yanında ucuz kalmalı).
    const timeoutMs = Number(process.env["GROUNDING_TIMEOUT_MS"] ?? "20000");
    const res = await ai.models.generateContent({
      model,
      contents:
        `Kısa bir pazar araştırması yap: "${signal.title}" (kaynak: ${signal.source}) ` +
        `benzeri bir ürün/hizmet şu anda Türkiye veya MENA pazarında sunuluyor mu? ` +
        `Varsa kim sunuyor, hangi olgunlukta (erken/büyümüş/hakim oyuncu)? ` +
        `Bulgularını 3-5 cümlede özetle, iddialarını mümkünse kaynak/isimle destekle. ` +
        `Hiçbir şey bulamazsan bunu açıkça söyle — uydurma.`,
      config: { tools: [{ googleSearch: {} }], abortSignal: AbortSignal.timeout(timeoutMs) },
    });
    return res.text?.trim() || null;
  } catch (e) {
    console.error(`grounding başarısız (${signal.url}):`, e instanceof Error ? e.message : e);
    return null;
  }
}
