import { SignJWT, jwtVerify } from "jose";

// Edge-güvenli: yalnız jose (Web Crypto). middleware + server helper'lar bunu paylaşır.
// node:crypto BURAYA GİRMEZ (parola hash'i lib/password.ts'te, yalnız Node route'larda).

export const SESSION_COOKIE = "if_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 gün

export interface SessionUser {
  username: string;
  display_name: string;
  is_admin: boolean;
}

function secret(): Uint8Array | null {
  const s = process.env["AUTH_SECRET"];
  return s ? new TextEncoder().encode(s) : null;
}

/** AUTH_SECRET set mi? Değilse auth kapalı (lokal dev/demo → açık). */
export function authEnabled(): boolean {
  return !!process.env["AUTH_SECRET"];
}

export async function signSession(user: SessionUser): Promise<string> {
  const key = secret();
  if (!key) throw new Error("AUTH_SECRET yok — oturum imzalanamaz");
  return await new SignJWT({
    username: user.username,
    display_name: user.display_name,
    is_admin: user.is_admin,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key);
}

export async function verifySession(
  token: string | undefined | null,
): Promise<SessionUser | null> {
  if (!token) return null;
  const key = secret();
  if (!key) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    const username = payload["username"];
    const display_name = payload["display_name"];
    // eski tokenlarda is_admin yok (0006 öncesi imzalandı) → varsayılan false.
    const is_admin = payload["is_admin"] === true;
    if (typeof username === "string" && typeof display_name === "string") {
      return { username, display_name, is_admin };
    }
    return null;
  } catch {
    return null;
  }
}
