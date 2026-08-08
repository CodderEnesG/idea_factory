import { NextResponse } from "next/server";
import { serverDb } from "../../../../lib/supabase";
import { requireAdmin } from "../../../../lib/auth";
import type { ThesisConfig } from "@idea-factory/core";

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string" && x.trim().length > 0);
}

function parseThesis(body: unknown): ThesisConfig | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b["capital_range"] !== "string" || !b["capital_range"].trim()) return null;
  if (typeof b["risk_appetite"] !== "string" || !b["risk_appetite"].trim()) return null;
  if (!isStringArray(b["target_markets"]) || b["target_markets"].length === 0) return null;
  if (!isStringArray(b["sectors"]) || b["sectors"].length === 0) return null;
  if (!isStringArray(b["capabilities"]) || b["capabilities"].length === 0) return null;
  if (!isStringArray(b["anti_patterns"])) return null;
  return {
    version: "", // aşağıda üretilir
    capital_range: b["capital_range"],
    risk_appetite: b["risk_appetite"],
    target_markets: b["target_markets"],
    sectors: b["sectors"],
    capabilities: b["capabilities"],
    anti_patterns: b["anti_patterns"],
  };
}

/** Admin-only: yeni tez versiyonu kaydeder, aktif olarak işaretler (eski versiyonlar durur — rollback için). */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "yetki gerekli (admin)" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = parseThesis(body);
  if (!parsed) {
    return NextResponse.json({ ok: false, error: "geçersiz tez gövdesi" }, { status: 400 });
  }

  const db = serverDb();
  if (!db) return NextResponse.json({ ok: false, error: "backend yapılandırılmadı" }, { status: 503 });

  const { count } = await db
    .from("thesis_versions")
    .select("id", { count: "exact", head: true });
  const version = `v${(count ?? 0) + 1}`;
  parsed.version = version;

  // önce eskileri pasifle, sonra yeniyi aktif ekle (versiyon geçmişi kalır — rollback mümkün).
  const { error: deactivateError } = await db
    .from("thesis_versions")
    .update({ is_active: false })
    .eq("is_active", true);
  if (deactivateError) {
    return NextResponse.json({ ok: false, error: deactivateError.message }, { status: 500 });
  }

  const { error: insertError } = await db.from("thesis_versions").insert({
    version,
    config: parsed,
    is_active: true,
    created_by: admin.username,
  });
  if (insertError) {
    return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, version });
}
