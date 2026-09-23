import type { SignalType } from "@idea-factory/core";
import { wpFeed } from "./wpfeed.js";

/**
 * Türkiye'ye benzeyen pazarlardan ve Türkiye'ye özgü ticaret/girişim basınından RSS kaynakları.
 *
 * Gerekçe (ölçüm, 2026-09-23, fit≥80 / analiz): benzer-pazar kaynakları en verimli olanlar —
 * wamda (MENA) 8/35, contxto (LatAm) 10/59, inc42 (Hindistan) 7/49, eu_startups 27/93; global
 * lansman kaynağı producthunt ise 8/1037. Türkiye'ye ekonomik/ticari/hukuki olarak benzeyen
 * gelişmekte olan pazarlarda (Nijerya, Güneydoğu Asya, Brezilya, Pakistan) kanıtlanmış bir model,
 * TR'de henüz kurulmamışsa arbitraj fırsatıdır. Hepsi kaynağın kendi yayımladığı herkese açık RSS.
 * Sinyal dili İngilizce/Portekizce/Türkçe olabilir; analiz aşaması dilden bağımsız.
 */
function inferType(title: string, categories: string[]): SignalType {
  const t = `${title} ${categories.join(" ")}`.toLocaleLowerCase("tr");
  if (
    /rais|funding|seed|series\s+[a-e]|valuation|\$\d|yatırım|fonlama|değerleme|tohum|milyon dolar|rodada|capta|aporte|investimento/.test(t)
  )
    return "funding";
  if (/launch|introduc|releas|unveil|debut|tanıt|başlat|yayında|lança|lançamento|estreia/.test(t))
    return "launch";
  return "company";
}

export const techcabal = wpFeed({ name: "techcabal", url: "https://techcabal.com/feed/", market: "Africa", inferType });
export const disruptAfrica = wpFeed({ name: "disrupt_africa", url: "https://disruptafrica.com/feed/", market: "Africa", inferType });
export const e27 = wpFeed({ name: "e27", url: "https://e27.co/feed/", market: "SE Asia", inferType, limit: 30 });
export const startupi = wpFeed({ name: "startupi", url: "https://startupi.com.br/feed/", market: "Brazil", inferType });
export const neofeed = wpFeed({ name: "neofeed", url: "https://neofeed.com.br/feed/", market: "Brazil", inferType });
export const proPakistani = wpFeed({ name: "propakistani", url: "https://propakistani.pk/feed/", market: "Pakistan", inferType });

// Türkiye'ye özgü ticaret basını: Webrazzi/Egirişim dışında pazar (perakende, dijital pazarlama/e-ticaret).
// Denenip çıkarılanlar: Tech in Asia (403, erişimi engelliyor), Dünya girişim (filtreyi yok sayıp genel siyasi haber döndürüyor).
export const perakende = wpFeed({ name: "perakende", url: "https://www.perakende.org/rss", market: "TR", inferType, limit: 30 });
export const digitalAge = wpFeed({ name: "digitalage", url: "https://www.digitalage.com.tr/feed/", market: "TR", inferType, limit: 30 });

export const REGIONAL_SOURCE_NAMES = [
  "techcabal", "disrupt_africa", "e27", "startupi", "neofeed", "propakistani",
  "perakende", "digitalage",
] as const;
