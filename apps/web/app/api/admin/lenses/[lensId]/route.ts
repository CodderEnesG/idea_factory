import { NextResponse } from "next/server";
import { serverDb } from "../../../../../lib/supabase";
import { requireAdmin } from "../../../../../lib/auth";

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string" && x.trim().length > 0);
}

/** Admin-only: bir admin-merceğini düzenler / aktif-pasif eder. Builtin mercekler bu tabloda yok. */
export async function PATCH(req: Request, { params }: { params: { lensId: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "yetki gerekli (admin)" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ ok: false, error: "geçersiz gövde" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (typeof body["active"] === "boolean") patch["active"] = body["active"];
  if (typeof body["name"] === "string" && body["name"].trim()) patch["name"] = body["name"].trim();
  if (typeof body["extra_note_label"] === "string" && body["extra_note_label"].trim()) {
    patch["extra_note_label"] = body["extra_note_label"].trim();
  }
  if (typeof body["weight"] === "number" && body["weight"] > 0) patch["weight"] = body["weight"];
  if (isStringArray(body["questions"]) && body["questions"].length > 0) {
    patch["questions"] = body["questions"];
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: false, error: "değişiklik yok" }, { status: 400 });
  }

  const db = serverDb();
  if (!db) return NextResponse.json({ ok: false, error: "backend yapılandırılmadı" }, { status: 503 });

  const { error } = await db.from("lenses").update(patch).eq("lens_id", params.lensId);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
