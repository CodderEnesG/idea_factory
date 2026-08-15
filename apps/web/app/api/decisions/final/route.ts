import { NextResponse } from "next/server";
import { serverDb } from "../../../../lib/supabase";
import { getSession } from "../../../../lib/auth";
import { authEnabled } from "../../../../lib/session";
import { PURSUE_STARTER_TASKS } from "../../../../lib/task-templates";

const VALID = new Set(["pursue", "watch", "kill"]);
const WATCH_REVIEW_DAYS = 30;

/**
 * "Kesinleşmiş karar" (0013_final_decisions.sql) — kişisel `decisions`'tan ayrı, sinyal
 * başına TEK resmi satır (problem 1: "herkes fikir belirtiyor ama netice belirlenmiyor").
 * Kullanıcı kararı (2026-08-15): herhangi bir üye kilitleyebilir/açabilir, admin kısıtı yok.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (authEnabled() && !session) {
    return NextResponse.json({ ok: false, error: "kimlik doğrulama gerekli" }, { status: 401 });
  }
  const decidedBy = session?.username ?? "web";

  const body = (await req.json().catch(() => null)) as
    | { signal_id?: string; decision?: string; reason?: string }
    | null;
  if (!body?.signal_id || !body?.decision || !VALID.has(body.decision)) {
    return NextResponse.json({ ok: false, error: "geçersiz istek" }, { status: 400 });
  }

  const db = serverDb();
  if (!db) return NextResponse.json({ ok: true, demo: true });

  // Kilitleme yeniden-oy değil devrilebilir tek satır — kim kilitlerse üstüne yazar
  // (decided_by/decided_at güncellenir, kim en son karar verdiyse o sorumlu görünür).
  const { error } = await db.from("final_decisions").upsert({
    signal_id: body.signal_id,
    decision: body.decision,
    reason: body.reason?.trim() || null,
    decided_by: decidedBy,
    decided_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  // İzle kilitlenince +30 gün sonra Panom'un "Bugün gözden geçir" bloğunda tekrar yüzeye
  // çıksın (problem 5: "izleler ne olacak"); başka banda kilitlenince temizlenir.
  const watchReviewAt =
    body.decision === "watch" ? new Date(Date.now() + WATCH_REVIEW_DAYS * 24 * 60 * 60 * 1000).toISOString() : null;
  await db.from("signals").update({ watch_review_at: watchReviewAt }).eq("id", body.signal_id);

  if (body.decision === "pursue") {
    const { count } = await db
      .from("item_tasks")
      .select("id", { count: "exact", head: true })
      .eq("signal_id", body.signal_id)
      .eq("owner", decidedBy);
    if (!count) {
      await db
        .from("item_tasks")
        .insert(PURSUE_STARTER_TASKS.map((task) => ({ signal_id: body.signal_id, owner: decidedBy, body: task })));
    }
  }

  return NextResponse.json({ ok: true });
}

/** Kilidi aç — sinyal kişisel kararlara/AI bandına geri düşer. */
export async function DELETE(req: Request) {
  const session = await getSession();
  if (authEnabled() && !session) {
    return NextResponse.json({ ok: false, error: "kimlik doğrulama gerekli" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { signal_id?: string } | null;
  if (!body?.signal_id) {
    return NextResponse.json({ ok: false, error: "geçersiz istek" }, { status: 400 });
  }

  const db = serverDb();
  if (!db) return NextResponse.json({ ok: true, demo: true });

  const { error } = await db.from("final_decisions").delete().eq("signal_id", body.signal_id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  await db.from("signals").update({ watch_review_at: null }).eq("id", body.signal_id);

  return NextResponse.json({ ok: true });
}
