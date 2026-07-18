import type { SignalType } from "@idea-factory/core";
import { wpFeed } from "./wpfeed.js";

/**
 * Webrazzi — TR ekosistem haberleri. BENCH.md'nin "haftalık el taraması" kaynağı
 * artık otomatik: yatırım turları funding, ürün/girişim tanıtımları launch.
 */
function inferType(title: string, categories: string[]): SignalType {
  const t = `${title} ${categories.join(" ")}`.toLocaleLowerCase("tr");
  if (/yatırım|fonlama|değerleme|tohum|seed|series\s+[a-e]|milyon dolar|\$\d/.test(t))
    return "funding";
  if (/tanıt|kurul|launch|başlat|yayında|çıkar/.test(t)) return "launch";
  return "company";
}

export const webrazzi = wpFeed({
  name: "webrazzi",
  url: "https://webrazzi.com/feed",
  market: "TR",
  inferType,
});
