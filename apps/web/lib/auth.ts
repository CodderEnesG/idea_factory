import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession, type SessionUser } from "./session";

// Server-only (next/headers). Server component + Node route handler'larda kullanılır.
// middleware BUNU İMPORT ETMEZ (next/headers edge'de yok) — orada req.cookies + verifySession.

/** Mevcut oturum kullanıcısı, yoksa null. */
export async function getSession(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

/** Mevcut oturum admin ise kullanıcıyı döner, değilse (oturum yok / admin değil) null. */
export async function requireAdmin(): Promise<SessionUser | null> {
  const session = await getSession();
  return session?.is_admin ? session : null;
}
