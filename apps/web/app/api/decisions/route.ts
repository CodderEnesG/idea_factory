import { NextResponse } from "next/server";
import { serverDb } from "../../../lib/supabase";

const VALID = new Set(["pursue", "watch", "kill"]);

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { signal_id?: string; decision?: string }
    | null;
  if (!body?.signal_id || !body?.decision || !VALID.has(body.decision)) {
    return NextResponse.json({ ok: false, error: "geçersiz istek" }, { status: 400 });
  }

  const db = serverDb();
  if (!db) return NextResponse.json({ ok: true, demo: true }); // backend yok → no-op

  const { error } = await db
    .from("decisions")
    .insert({ signal_id: body.signal_id, decision: body.decision, decided_by: "web" });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
