import type { SignalType } from "@idea-factory/core";
import { wpFeed } from "./wpfeed.js";

/** Rest of World — Batı dışı teknoloji gazeteciliği (Afrika/Asya/LatAm/MENA). Fonlama değil,
 *  davranış/pazar sinyali: hangi model hangi gelişmekte olan pazarda tuttu. */
function inferType(title: string, categories: string[]): SignalType {
  const t = `${title} ${categories.join(" ")}`.toLowerCase();
  if (/rais|funding|seed|series\s+[a-e]|valuation|€\d|\$\d+(\.\d+)?\s*[mb]|yatırım|fonlama/.test(t)) return "funding";
  if (/launch|introduc|releas|unveil|debut|başlat|tanıt/.test(t)) return "launch";
  return "company";
}

export const restOfWorld = wpFeed({
  name: "restofworld",
  url: "https://restofworld.org/feed/latest/",
  market: "Emerging",
  inferType,
});
