import type { SignalType } from "@idea-factory/core";
import { wpFeed } from "./wpfeed.js";

/** EU-Startups — Avrupa girişim ekosistemi. TechCrunch/YC'nin domine ettiği ABD
 *  merkezli, aşırı fonlu sinyal profilinden farklı: Avrupa turları genelde daha
 *  küçük ölçekli, Türkiye pazarına daha yakın bir "kanıtlanmış model" emsali sunar. */
function inferType(title: string, categories: string[]): SignalType {
  const t = `${title} ${categories.join(" ")}`.toLowerCase();
  if (/rais|funding|seed|series\s+[a-e]|valuation|€\d|\$\d+(\.\d+)?\s*[mb]/.test(t)) return "funding";
  if (/launch|introduc|releas|unveil|debut/.test(t)) return "launch";
  return "company";
}

export const euStartups = wpFeed({
  name: "eu_startups",
  url: "https://www.eu-startups.com/feed/",
  market: "Europe",
  inferType,
});
