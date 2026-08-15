import { canonicalSourceName } from "./source-health";

// source-health.ts'teki KNOWN_SOURCES ile senkron tutulmalı — yeni bir worker kaynağı
// eklenince buraya da okunabilir etiketi eklenir.
const SOURCE_LABELS: Record<string, string> = {
  producthunt: "Product Hunt",
  tldr: "TLDR",
  webrazzi: "Webrazzi",
  techcrunch: "TechCrunch",
  ycombinator: "Y Combinator",
};

/** Ham `signals.source` değerini ("tldr:founders") okunabilir bir etikete çevirir ("TLDR"). */
export function formatSource(raw: string): string {
  const canonical = canonicalSourceName(raw);
  return SOURCE_LABELS[canonical] ?? canonical;
}
