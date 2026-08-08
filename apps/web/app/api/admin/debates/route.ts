import { NextResponse } from "next/server";
import { runDebate, type Signal } from "@idea-factory/core";
import { serverDb } from "../../../../lib/supabase";
import { requireAdmin } from "../../../../lib/auth";
import { loadActiveThesis } from "../../../../lib/active-thesis";

export const runtime = "nodejs"; // sabit 7 LLM çağrısı — Edge süre sınırına takılmasın

/** Admin-only: AI Yorumcusu — bir sinyal için çok-ajanlı tartışma tetikler (analyses'a değil, ayrı debates tablosuna yazar). */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "yetki gerekli (admin)" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as { signal_id?: string } | null;
  if (!body?.signal_id) {
    return NextResponse.json({ ok: false, error: "signal_id gerekli" }, { status: 400 });
  }

  const db = serverDb();
  if (!db) return NextResponse.json({ ok: false, error: "backend yapılandırılmadı" }, { status: 503 });

  const { data: signal, error: signalError } = await db
    .from("signals")
    .select("*")
    .eq("id", body.signal_id)
    .maybeSingle();
  if (signalError || !signal) {
    return NextResponse.json({ ok: false, error: "sinyal bulunamadı" }, { status: 404 });
  }

  const thesis = await loadActiveThesis();

  let result;
  try {
    result = await runDebate(signal as Signal, { thesis });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "tartışma başarısız";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }

  const { data: inserted, error: insertError } = await db
    .from("debates")
    .insert({
      signal_id: body.signal_id,
      created_by: admin.username,
      transcript: result.transcript,
      final_verdict: result.final_verdict,
      final_commentary: result.final_commentary,
    })
    .select("id, transcript, final_verdict, final_commentary, created_by, created_at")
    .single();
  if (insertError || !inserted) {
    return NextResponse.json({ ok: false, error: insertError?.message ?? "kayıt hatası" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, debate: inserted });
}
