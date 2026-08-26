import { NextResponse } from "next/server";
import { serverDb } from "../../../../lib/supabase";
import { getSession } from "../../../../lib/auth";
import { authEnabled } from "../../../../lib/session";

const MAX_BODY = 500;

/**
 * Görev güncelleme. Yetki modeli KASITLI olarak asimetrik (FAZ6_PLAN.md §Faz 6.2):
 *
 *  - `done` toggle'ını EKİPTEN HERKES yapabilir. Görevler artık ekipçe görünür ve 3 şablon
 *    görev Kovala'ya ilk basanın üstünde kalıyor — takım arkadaşı onları tamamlayamazsa
 *    paylaşımlı liste işe yaramaz.
 *  - `body` düzenlemek ve silmek yalnız SAHİBİNDE (ya da admin'de).
 */
export async function PATCH(req: Request, { params }: { params: { taskId: string } }) {
  const session = await getSession();
  if (authEnabled() && !session) {
    return NextResponse.json({ ok: false, error: "kimlik doğrulama gerekli" }, { status: 401 });
  }
  const owner = session?.username ?? "web";

  const body = (await req.json().catch(() => null)) as { done?: boolean; body?: string } | null;
  const hasDone = typeof body?.done === "boolean";
  const rawText = typeof body?.body === "string" ? body.body.trim() : undefined;
  const hasText = rawText !== undefined;

  if (!hasDone && !hasText) {
    return NextResponse.json({ ok: false, error: "geçersiz istek" }, { status: 400 });
  }
  if (hasText && !rawText) {
    return NextResponse.json({ ok: false, error: "görev metni boş olamaz" }, { status: 400 });
  }
  if (hasText && rawText!.length > MAX_BODY) {
    return NextResponse.json(
      { ok: false, error: `görev metni en fazla ${MAX_BODY} karakter` },
      { status: 400 },
    );
  }

  const db = serverDb();
  if (!db) return NextResponse.json({ ok: true, demo: true }); // backend yok → no-op

  const patch: Record<string, unknown> = {};
  if (hasDone) {
    patch["done"] = body!.done;
    patch["completed_at"] = body!.done ? new Date().toISOString() : null;
  }
  if (hasText) patch["body"] = rawText;

  let query = db.from("item_tasks").update(patch).eq("id", params.taskId);
  // Sahip kısıtı YALNIZ metin düzenlemede — `done` ekipçe serbest (yukarıdaki not).
  if (hasText && !session?.is_admin) query = query.eq("owner", owner);

  const { data, error } = await query.select("id");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!data || data.length === 0) {
    return NextResponse.json({ ok: false, error: "görev bulunamadı" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

/** Görevi siler. Yalnız sahibi (veya admin) — `task-templates.ts` bunu zaten vaat ediyordu
 *  ("kullanıcı düzenler/siler") ama uç nokta hiç yazılmamıştı. */
export async function DELETE(_req: Request, { params }: { params: { taskId: string } }) {
  const session = await getSession();
  if (authEnabled() && !session) {
    return NextResponse.json({ ok: false, error: "kimlik doğrulama gerekli" }, { status: 401 });
  }
  const owner = session?.username ?? "web";

  const db = serverDb();
  if (!db) return NextResponse.json({ ok: true, demo: true });

  let query = db.from("item_tasks").delete().eq("id", params.taskId);
  if (!session?.is_admin) query = query.eq("owner", owner);

  const { data, error } = await query.select("id");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!data || data.length === 0) {
    return NextResponse.json({ ok: false, error: "görev bulunamadı" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
