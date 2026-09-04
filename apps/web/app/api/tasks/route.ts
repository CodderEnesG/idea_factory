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
  const owner = session?.username ?? "web"; // auth kapalıysa (lokal/demo) anonim

  const body = (await req.json().catch(() => null)) as
    | { signal_id?: string; body?: string }
    | null;
  const text = body?.body?.trim();
  if (!body?.signal_id || !text) {
    return NextResponse.json({ ok: false, error: "signal_id ve görev metni gerekli" }, { status: 400 });
  }
  if (text.length > 500) {
    return NextResponse.json({ ok: false, error: "görev metni en fazla 500 karakter" }, { status: 400 });
  }

  const db = serverDb();
  if (!db) {
    // demo/lokal: DB yok → optimistic append için sahte satır döndür
    return NextResponse.json({
      ok: true,
      demo: true,
      task: { id: `demo-${Date.now()}`, body: text, done: false, owner, created_at: new Date().toISOString() },
    });
  }

  const { data, error } = await db
    .from("item_tasks")
    .insert({ signal_id: body.signal_id, owner, body: text })
    .select("id, body, done, owner, created_at")
    .single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, task: data });
}
