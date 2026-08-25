import type { SignalType } from "@idea-factory/core";
import { wpFeed } from "./wpfeed.js";

/** Webrazzi'nin E-Ticaret kategori feed'i — bkz. webrazzi-fintech.ts notu, aynı boşluk
 *  "e-ticaret altyapısı" (tezin 4. sektörü) için de geçerliydi. */
function inferType(title: string, categories: string[]): SignalType {
  const t = `${title} ${categories.join(" ")}`.toLocaleLowerCase("tr");
  if (/yatırım|fonlama|değerleme|tohum|seed|series\s+[a-e]|milyon dolar|\$\d/.test(t))
    return "funding";
  if (/tanıt|kurul|launch|başlat|yayında|çıkar/.test(t)) return "launch";
  return "company";
}

export const webrazziEticaret = wpFeed({
  name: "webrazzi_eticaret",
  url: "https://webrazzi.com/kategori/e-ticaret/feed/",
  market: "TR",
  inferType,
});
