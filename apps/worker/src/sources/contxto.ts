import type { SignalType } from "@idea-factory/core";
import { wpFeed } from "./wpfeed.js";

/** Contxto — Latin Amerika girişim haberleri (İngilizce feed). Brezilya/Meksika, TR ile benzer
 *  makro profil (enflasyon, kur, bankasız nüfus) — arbitraj emsali olarak değerli. */
function inferType(title: string, categories: string[]): SignalType {
  const t = `${title} ${categories.join(" ")}`.toLowerCase();
  if (/rais|funding|seed|series\s+[a-e]|valuation|€\d|\$\d+(\.\d+)?\s*[mb]|yatırım|fonlama/.test(t)) return "funding";
  if (/launch|introduc|releas|unveil|debut|başlat|tanıt/.test(t)) return "launch";
  return "company";
}

export const contxto = wpFeed({
  name: "contxto",
  url: "https://contxto.com/en/feed/",
  market: "LatAm",
  inferType,
});
