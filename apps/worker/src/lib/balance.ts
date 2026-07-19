import type { Signal } from "@idea-factory/core";

/** Kaynak başına tavan uygulayarak sırayı dolaş; kota dolarsa sıradaki kaynağa geç. */
export function balanceBySource(signals: Signal[], limit: number, cap: number): Signal[] {
  const used = new Map<string, number>();
  const picked: Signal[] = [];
  const overflow: Signal[] = [];

  for (const s of signals) {
    if (picked.length >= limit) break;
    const n = used.get(s.source) ?? 0;
    if (n < cap) {
      used.set(s.source, n + 1);
      picked.push(s);
    } else {
      overflow.push(s);
    }
  }
  // Parti dolmadıysa tavanı aşan artıklarla tamamla (kaynak azsa boş geçmesin).
  for (const s of overflow) {
    if (picked.length >= limit) break;
    picked.push(s);
  }
  return picked;
}
