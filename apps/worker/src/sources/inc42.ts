import type { SignalType } from "@idea-factory/core";
import { wpFeed } from "./wpfeed.js";

/** Inc42 — Hindistan girişim ekosistemi. Gelişmekte olan pazar, TR'ye benzer ölçek/ödeme/lojistik
 *  kısıtları; ABD'den daha yakın bir "kanıtlanmış model" emsali. */
function inferType(title: string, categories: string[]): SignalType {
  const t = `${title} ${categories.join(" ")}`.toLowerCase();
  if (/rais|funding|seed|series\s+[a-e]|valuation|€\d|\$\d+(\.\d+)?\s*[mb]|yatırım|fonlama/.test(t)) return "funding";
  if (/launch|introduc|releas|unveil|debut|başlat|tanıt/.test(t)) return "launch";
  return "company";
}

export const inc42 = wpFeed({
  name: "inc42",
  url: "https://inc42.com/feed/",
  market: "India",
  inferType,
});
