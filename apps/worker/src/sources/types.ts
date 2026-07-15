import type { Signal } from "@idea-factory/core";

/** Bir kaynak = fetch() → normalize edilmiş Signal listesi. Yeni kaynak = tek dosya. */
export interface Source {
  name: string;
  fetch(): Promise<Signal[]>;
}
