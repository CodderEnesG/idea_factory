import { NextResponse } from "next/server";
import { serverDb } from "../../../../lib/supabase";
import { requireAdmin } from "../../../../lib/auth";

const BUILTIN_IDS = new Set(["arbitrage", "white_space"]);

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "") // aksan işaretlerini kaldır (ö→o vb.)
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "mercek"
  );
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string" && x.trim().length > 0);
}

/** Admin-only: yeni admin-merceği ekler. Builtin (arbitraj/beyaz-alan) burada YOK, düzenlenemez. */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "yetki gerekli (admin)" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const name = typeof body?.["name"] === "string" ? body["name"].trim() : "";
  const extraNoteLabel =
    typeof body?.["extra_note_label"] === "string" ? body["extra_note_label"].trim() : "";
  const weight = typeof body?.["weight"] === "number" && body["weight"] > 0 ? body["weight"] : 1;
  const questions = body?.["questions"];
  if (!name || !extraNoteLabel || !isStringArray(questions) || questions.length === 0) {
    return NextResponse.json({ ok: false, error: "geçersiz mercek gövdesi" }, { status: 400 });
  }

  const db = serverDb();
  if (!db) return NextResponse.json({ ok: false, error: "backend yapılandırılmadı" }, { status: 503 });

  const base = slugify(name);
  let lensId = base;
  if (BUILTIN_IDS.has(lensId)) lensId = `${base}_custom`;
  for (let i = 2; i < 50; i++) {
    const { data } = await db.from("lenses").select("lens_id").eq("lens_id", lensId).maybeSingle();
    if (!data) break;
    lensId = `${base}_${i}`;
  }

  const { error } = await db.from("lenses").insert({
    lens_id: lensId,
    name,
    weight,
    extra_note_label: extraNoteLabel,
    questions,
    active: true,
    created_by: admin.username,
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, lens_id: lensId });
}
