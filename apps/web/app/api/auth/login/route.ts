import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { serverDb } from "../../../../lib/supabase";
import { signSession, SESSION_COOKIE, SESSION_MAX_AGE } from "../../../../lib/session";
import { verifyPasswordConstantTime } from "../../../../lib/password";
import { checkLocked, recordFailure, recordSuccess } from "../../../../lib/rate-limit";

export const runtime = "nodejs"; // node:crypto (scrypt) gerekir

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { username?: string; password?: string }
    | null;
  if (!body?.username || !body?.password) {
    return NextResponse.json({ ok: false, error: "kullanıcı adı ve parola gerekli" }, { status: 400 });
  }

  const lockKey = body.username.toLowerCase();
  const remainingMs = checkLocked(lockKey);
  if (remainingMs !== null) {
    return NextResponse.json(
      { ok: false, error: `çok fazla başarısız deneme — ${Math.ceil(remainingMs / 60_000)} dakika sonra tekrar dene` },
      { status: 429 },
    );
  }

  const db = serverDb();
  if (!db) return NextResponse.json({ ok: false, error: "backend yapılandırılmadı" }, { status: 503 });

  // maybeSingle() + constant-time karşılaştırma: kullanıcı adı var/yok fark etmeksizin
  // aynı scrypt maliyeti ödenir (/cso #2 — timing ile kullanıcı adı keşfi engellenir).
  const { data, error } = await db
    .from("members")
    .select("username, display_name, password_hash, is_admin")
    .eq("username", body.username)
    .maybeSingle();

  // `data?.password_hash` unconditionally: kullanıcı bulunamasa bile aynı scrypt maliyeti
  // ödenir — `!data` kısayoluyla erken dönersek fonksiyon hiç çağrılmaz ve timing farkı geri gelir.
  const passwordOk = verifyPasswordConstantTime(body.password, data?.password_hash);
  if (error || !data || !passwordOk) {
    recordFailure(lockKey);
    return NextResponse.json({ ok: false, error: "geçersiz kullanıcı adı veya parola" }, { status: 401 });
  }
  recordSuccess(lockKey);

  const token = await signSession({
    username: data.username,
    display_name: data.display_name,
    is_admin: data.is_admin === true,
  });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return NextResponse.json({ ok: true, display_name: data.display_name });
}
