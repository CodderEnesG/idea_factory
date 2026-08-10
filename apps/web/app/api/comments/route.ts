import { NextResponse } from "next/server";
import { serverDb } from "../../../lib/supabase";
import { getSession } from "../../../lib/auth";
import { authEnabled } from "../../../lib/session";

export async function POST(req: Request) {
  const session = await getSession();
  // İkinci katman (/cso #3): bkz. decisions/route.ts — yalnız middleware'e güvenme.
  if (authEnabled() && !session) {
    return NextResponse.json({ ok: false, error: "kimlik doğrulama gerekli" }, { status: 401 });
  }
  const author = session?.username ?? "web"; // auth kapalıysa (lokal/demo) anonim

  const body = (await req.json().catch(() => null)) as
    | { signal_id?: string; body?: string }
    | null;
  const text = body?.body?.trim();
  if (!body?.signal_id || !text) {
    return NextResponse.json({ ok: false, error: "signal_id ve yorum metni gerekli" }, { status: 400 });
  }

  const db = serverDb();
  if (!db) {
    // demo/lokal: DB yok → optimistic append için sahte satır döndür
    return NextResponse.json({
      ok: true,
      demo: true,
      comment: { id: `demo-${Date.now()}`, author, body: text, created_at: new Date().toISOString() },
    });
  }

  const { data, error } = await db
    .from("comments")
    .insert({ signal_id: body.signal_id, author, body: text })
    .select("id, author, body, created_at")
    .single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, comment: data });
}
