import type { CardView } from "./card-view";
import { canonicalSourceName } from "./source-health";
import { formatSource } from "./source-labels";

// Sektör/pazar alanları serbest metin AI çıktısı — "Fintech"/"fintech", "US"/"USA"/"United
// States"/"ABD" gibi aynı şeyi anlatan varyantlar ayrı filtre satırı olarak görünmesin diye
// büyük/küçük harf + boşluk normalize edilir, bilinen eş anlamlılar tek etikette birleşir.
// Kuyruk (QueueBoard) ve Panom (PanomBoard) filtre çubukları aynı mantığı paylaşır.
const TAG_ALIASES: Record<string, string> = {
  us: "US",
  usa: "US",
  "united states": "US",
  abd: "US",
  global: "Global",
};

export function normalizeTag(raw: string): { key: string; label: string } {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  const lower = trimmed.toLowerCase();
  const alias = TAG_ALIASES[lower];
  if (alias) return { key: alias.toLowerCase(), label: alias };
  return { key: lower, label: trimmed };
}

export function distinct(
  items: CardView[],
  pick: (i: CardView) => string | null,
): { key: string; label: string }[] {
  const byKey = new Map<string, string>();
  for (const i of items) {
    const v = pick(i);
    if (!v) continue;
    const { key, label } = normalizeTag(v);
    if (!byKey.has(key)) byKey.set(key, label);
  }
  return [...byKey.entries()]
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "tr"));
}

// Kaynak filtresi ayrı: "tldr:founders"/"tldr:ai" gibi alt-kategoriler tek "TLDR" seçeneğinde
// birleşmeli (source-health.ts'teki kanonikleştirmeyle aynı mantık), sektör/pazar gibi serbest
// metin değil.
export function distinctSources(items: CardView[]): { key: string; label: string }[] {
  const byKey = new Map<string, string>();
  for (const i of items) {
    const key = canonicalSourceName(i.source);
    if (!byKey.has(key)) byKey.set(key, formatSource(i.source));
  }
  return [...byKey.entries()]
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "tr"));
}
