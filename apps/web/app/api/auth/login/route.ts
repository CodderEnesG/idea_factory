import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { serverDb } from "../../../../lib/supabase";
import { signSession, SESSION_COOKIE, SESSION_MAX_AGE } from "../../../../lib/session";
import { verifyPassword } from "../../../../lib/password";

export const runtime = "nodejs"; // node:crypto (scrypt) gerekir

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { username?: string; password?: string }
    | null;
  if (!body?.username || !body?.password) {
    return NextResponse.json({ ok: false, error: "kullanıcı adı ve parola gerekli" }, { status: 400 });
  }

  const db = serverDb();
  if (!db) return NextResponse.json({ ok: false, error: "backend yapılandırılmadı" }, { status: 503 });

  const { data, error } = await db
    .from("members")
    .select("username, display_name, password_hash, is_admin")
    .eq("username", body.username)
    .maybeSingle();

  if (error || !data || !verifyPassword(body.password, data.password_hash)) {
    return NextResponse.json({ ok: false, error: "geçersiz kullanıcı adı veya parola" }, { status: 401 });
  }

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
