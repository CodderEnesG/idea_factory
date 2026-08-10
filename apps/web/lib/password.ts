import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

// Node-only. Yalnız login route + add-member script import eder (edge'e sızmaz).
// Format: "saltHex:hashHex". Dep yok (node:crypto scrypt).

export function hashPassword(pw: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(pw, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(pw, Buffer.from(saltHex, "hex"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Sabit decoy — kullanıcı adı DB'de yokken bile aynı scrypt maliyetini ödemek için
// (/cso bulgusu #2: yokluk erken dönüyordu, timing ile kullanıcı adı keşfedilebiliyordu).
const DECOY_HASH = hashPassword("bu-asla-eslesmeyecek-bir-decoy-parola");

/** `stored` yoksa bile (kullanıcı bulunamadı) gerçek karşılaştırmayla aynı maliyeti öder. */
export function verifyPasswordConstantTime(pw: string, stored: string | null | undefined): boolean {
  return verifyPassword(pw, stored ?? DECOY_HASH);
}
