/**
 * Migration henüz uygulanmamışken kodun çökmemesi için (FAZ6_PLAN.md — 0014/0015).
 *
 * Migration'lar Supabase Dashboard'dan elle uygulanıyor (REST üzerinden DDL çalıştırma yolu
 * yok). Yani kod ile şema arasında kaçınılmaz bir pencere var. O pencerede yeni kolonları
 * seçen bir sorgu 42703 ("column does not exist") ile patlıyor ve sonuçları çok kötü:
 *   - `load-debates` patlarsa HER fit>=80 sinyal `pending`e düşer, kovala sütunu boşalır
 *   - `load-lens-registry` patlarsa mercek listesi boşalır, ağırlıklar 1'e döner ve
 *     ağırlığı 0 olan beyaz-alan kompozit skora karışmaya başlar
 *
 * Bu yüzden yeni-kolonlu sorgu başarısız olursa eski kolon setiyle bir kez daha denenir.
 * Migration uygulandıktan sonra ikinci deneme hiç tetiklenmez.
 */

/** Postgres "undefined_column" — PostgREST bunu `error.code` olarak aynen geçirir. */
export const UNDEFINED_COLUMN = "42703";

export function isMissingColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === UNDEFINED_COLUMN || /column .* does not exist/i.test(error.message ?? "");
}
