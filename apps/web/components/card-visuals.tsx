import type { Band, Confidence } from "../lib/card-view";

/** Ham "low/med/high" İngilizce enum'u Türkçe arayüzde göstermemek için (Faz 5.3). */
export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  low: "düşük",
  med: "orta",
  high: "yüksek",
};

/** Bant renk/etiket sözlüğü + fit halkası — DetailPanel/PanomCard paylaşır. */
export const BAND: Record<Band, { label: string; text: string; dot: string; border: string; hex: string }> = {
  pursue: { label: "KOVALA", text: "text-pursue", dot: "bg-pursue", border: "border-t-pursue", hex: "#0ca30c" },
  watch: { label: "İZLE", text: "text-watch", dot: "bg-watch", border: "border-t-watch", hex: "#fab219" },
  kill: { label: "ELE", text: "text-kill", dot: "bg-kill", border: "border-t-kill", hex: "#d03b3b" },
};

export function FitRing({ fit, hex, size = 44 }: { fit: number; hex: string; size?: number }) {
  const inner = size - 10;
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full"
      title={`Uyum skoru: ${fit}/100`}
      style={{ width: size, height: size, background: `conic-gradient(${hex} ${fit}%, rgba(247,246,251,0.1) 0)` }}
    >
      <div
        className="grid place-items-center rounded-full bg-elevated font-mono font-bold"
        style={{ width: inner, height: inner, fontSize: size >= 60 ? 16 : 11 }}
      >
        {fit}
      </div>
    </div>
  );
}
