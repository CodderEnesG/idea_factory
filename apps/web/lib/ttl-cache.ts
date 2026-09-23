/**
 * Süreç-içi kısa ömürlü önbellek + eşzamanlı çağrı tekilleştirme. Uzak Supabase'e her sorgu ~300 ms
 * ağ gecikmesi; her sayfa geçişi aynı yardımcı tabloları (karar, görev, yorum, tartışma) yeniden
 * çekiyordu. Başarısız sonuç önbelleğe alınmaz.
 *
 * Durum `globalThis` üzerinde, ad ile tutulur: Next dev (özellikle --turbo) her rota paketi için
 * modülü ayrı örnekler, modül-içi bir `let` rotalar arasında PAYLAŞILMAZ (ölçüm: önbellek isabet
 * etmiyor, her geçiş tam maliyet). Çok örnekli dağıtımda her örnek kendi TTL'ini yaşar.
 */
type Entry = { at: number; value: Promise<unknown> };
const g = globalThis as unknown as { __ifTtl?: Map<string, Entry> };
const store = (): Map<string, Entry> => (g.__ifTtl ??= new Map());

export function ttlCache(name: string, ttlMs: number) {
  return {
    get<T>(load: () => Promise<T>): Promise<T> {
      const s = store();
      const hit = s.get(name);
      if (hit && Date.now() - hit.at < ttlMs) return hit.value as Promise<T>;
      const mine: Entry = { at: Date.now(), value: load() as Promise<unknown> };
      s.set(name, mine);
      mine.value.catch(() => {
        if (s.get(name) === mine) s.delete(name);
      });
      return mine.value as Promise<T>;
    },
    bust(): void {
      store().delete(name);
    },
  };
}

/** Anahtar başına ömürlü küçük harita (ör. sinyal ayrıntısı önbelleği) — aynı globalThis kuralı. */
export function globalMap<V>(name: string): Map<string, V> {
  const gm = globalThis as unknown as Record<string, Map<string, V> | undefined>;
  const key = `__ifMap_${name}`;
  return (gm[key] ??= new Map<string, V>());
}
