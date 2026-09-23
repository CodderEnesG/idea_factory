import type { CardView } from "./card-view";

const CONFIDENCE_TR = { low: "düşük", med: "orta", high: "yüksek" } as const;

/** Tek cümlelik "neden": en yüksek uyumlu merceğin gerekçesinin ilk cümlesi. */
export function whyLine(item: Pick<CardView, "lensViews" | "summary">): string {
  const best = [...item.lensViews].sort((a, b) => b.fit - a.fit)[0];
  // Worker, guard'la yeniden sınıflandırdığı gerekçelerin başına "[yeniden sınıflandı: …]" ekliyor —
  // kullanıcıya iç mekanik göstermiyoruz.
  const text = (best?.rationale || item.summary || "")
    .replace(/^\[[^\]]*\]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "Henüz gerekçe yok.";
  const first = text.match(/^.+?[.!?](\s|$)/)?.[0].trim() ?? text;
  return first.length > 240 ? `${first.slice(0, 237)}…` : first;
}

/** Yargıç/veto katmanının kullanıcıya inen tek satırlık özeti. */
export function trustNote(item: Pick<CardView, "gate" | "confidence">): string {
  switch (item.gate) {
    case "confirmed":
      return "iki bağımsız tartışma onayladı";
    case "caveat":
      return "onaylandı, çekinceli";
    case "pending":
      return "henüz doğrulanmadı";
    default:
      return `güven: ${CONFIDENCE_TR[item.confidence]}`;
  }
}

export function competitionNote(item: Pick<CardView, "competition">): string | null {
  const c = item.competition;
  if (!c || c.label === "belirsiz") return null;
  return c.label === "boş" ? "rakip: yok" : `rakip: ${c.label}`;
}
