import { NextResponse } from "next/server";
import { serverDb } from "../../../../lib/supabase";
import { getSession } from "../../../../lib/auth";
import { authEnabled } from "../../../../lib/session";

/** Görevi tamamlandı/tamamlanmadı işaretler. Yalnız görevin sahibi (veya admin) değiştirebilir. */
export async function PATCH(req: Request, { params }: { params: { taskId: string } }) {
  const session = await getSession();
  if (authEnabled() && !session) {
    return NextResponse.json({ ok: false, error: "kimlik doğrulama gerekli" }, { status: 401 });
  }
  const owner = session?.username ?? "web";

  const body = (await req.json().catch(() => null)) as { done?: boolean } | null;
  if (typeof body?.done !== "boolean") {
    return NextResponse.json({ ok: false, error: "geçersiz istek" }, { status: 400 });
  }

  const db = serverDb();
  if (!db) return NextResponse.json({ ok: true, demo: true }); // backend yok → no-op

  let query = db
    .from("item_tasks")
    .update({ done: body.done, completed_at: body.done ? new Date().toISOString() : null })
    .eq("id", params.taskId);
  if (!session?.is_admin) query = query.eq("owner", owner);

  const { data, error } = await query.select("id");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!data || data.length === 0) {
    return NextResponse.json({ ok: false, error: "görev bulunamadı" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
