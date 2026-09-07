import { canonicalSourceName } from "./source-health";

// source-health.ts'teki KNOWN_SOURCES ile senkron tutulmalı — yeni bir worker kaynağı
// eklenince buraya da okunabilir etiketi eklenir.
const SOURCE_LABELS: Record<string, string> = {
  producthunt: "Product Hunt",
  tldr: "TLDR",
  webrazzi: "Webrazzi",
  techcrunch: "TechCrunch",
  ycombinator: "Y Combinator",
  webrazzi_fintech: "Webrazzi Fintech",
  webrazzi_eticaret: "Webrazzi E-ticaret",
  webrazzi_yazilim: "Webrazzi Yazılım",
  techcrunch_fintech: "TechCrunch Fintech",
  techcrunch_enterprise: "TechCrunch Enterprise",
  techcrunch_commerce: "TechCrunch Commerce",
  saastr: "SaaStr",
  eu_startups: "EU-Startups",
  sifted: "Sifted",
  fintechtime: "Fintechtime",
  finberg: "Finberg",
  hackernews: "Hacker News",
  tech_eu: "Tech.eu",
  wamda: "Wamda",
  egirisim: "Egirişim",
  inc42: "Inc42",
  contxto: "Contxto",
  crunchbase_news: "Crunchbase News",
  restofworld: "Rest of World",
};

/** Ham `signals.source` değerini ("tldr:founders") okunabilir bir etikete çevirir ("TLDR"). */
export function formatSource(raw: string): string {
  const canonical = canonicalSourceName(raw);
  return SOURCE_LABELS[canonical] ?? canonical;
}
