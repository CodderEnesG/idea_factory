import type { SignalType } from "@idea-factory/core";
import { wpFeed } from "./wpfeed.js";

/** Wamda — MENA (Körfez/Mısır/Levant) girişim ekosistemi. Tezin ikinci hedef pazarı; buradaki
 *  sinyaller Türkiye için arbitraj emsali DEĞİL, doğrudan hedef pazar sinyalidir. */
function inferType(title: string, categories: string[]): SignalType {
  const t = `${title} ${categories.join(" ")}`.toLowerCase();
  if (/rais|funding|seed|series\s+[a-e]|valuation|€\d|\$\d+(\.\d+)?\s*[mb]|yatırım|fonlama/.test(t)) return "funding";
  if (/launch|introduc|releas|unveil|debut|başlat|tanıt/.test(t)) return "launch";
  return "company";
}

export const wamda = wpFeed({
  name: "wamda",
  url: "https://www.wamda.com/feed",
  market: "MENA",
  inferType,
});
