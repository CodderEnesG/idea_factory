import type { SignalType } from "@idea-factory/core";
import { wpFeed } from "./wpfeed.js";

/** Webrazzi'nin Yazılım kategori feed'i — B2B SaaS'ın TR tarafı için doğrudan isabet
 *  (bkz. webrazzi-fintech.ts notu, aynı kaynak-boşluğu analizi). */
function inferType(title: string, categories: string[]): SignalType {
  const t = `${title} ${categories.join(" ")}`.toLocaleLowerCase("tr");
  if (/yatırım|fonlama|değerleme|tohum|seed|series\s+[a-e]|milyon dolar|\$\d/.test(t))
    return "funding";
  if (/tanıt|kurul|launch|başlat|yayında|çıkar/.test(t)) return "launch";
  return "company";
}

export const webrazziYazilim = wpFeed({
  name: "webrazzi_yazilim",
  url: "https://webrazzi.com/kategori/yazilim/feed/",
  market: "TR",
  inferType,
});
