import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { authEnabled } from "../../../../lib/session";
import { serverDb } from "../../../../lib/supabase";
import { isMissingColumn } from "../../../../lib/pg-compat";

export const dynamic = "force-dynamic";

/**
 * Bir sinyalin tartışma TRANSKRİPTLERİ — lazy (FAZ6_PLAN.md §Faz 2.3).
 *
 * Liste sorgusu (`load-debates.ts`) transkripti taşımıyor: 260 × 7-tur JSONB her `/queue`
 * render'ında serileştiriliyordu. Kart açılınca buradan çekilir.
 *
 * Yetki: OKUMAK herkese açık (session gerekli) — Yorumcu artık kovala rozetini
 * düşürebiliyor, açıklanmayan bir veto güveni yıkar. TETİKLEMEK (7 LLM çağrısı)
 * `/api/admin/debates`'te admin-only kalır.
 */
export async function GET(
  _req: Request,
  { params }: { params: { signalId: string } },
): Promise<NextResponse> {
  const session = await getSession();
  if (authEnabled() && !session) {
    return NextResponse.json({ error: "yetkisiz" }, { status: 401 });
  }
  const signalId = params.signalId?.trim();
  if (!signalId) return NextResponse.json({ error: "signalId gerekli" }, { status: 400 });

  const db = serverDb();
  if (!db) return NextResponse.json({ debates: [] });

  const BASE = "id, transcript, final_verdict, final_commentary, created_by, created_at";
  let res = (await db
    .from("debates")
    .select(`${BASE}, kind, run_no, turn_count`)
    .eq("signal_id", signalId)
    .order("created_at", { ascending: false })) as {
    data: Record<string, unknown>[] | null;
    error: { code?: string; message: string } | null;
  };
  if (isMissingColumn(res.error)) {
    res = (await db
      .from("debates")
      .select(BASE)
      .eq("signal_id", signalId)
      .order("created_at", { ascending: false })) as typeof res;
  }
  const { data, error } = res;
  if (error) {
    console.error("[api/debates] sorgu hatası:", error.message);
    return NextResponse.json({ error: "tartışmalar yüklenemedi" }, { status: 500 });
  }
  return NextResponse.json({ debates: data ?? [] });
}
