import { NextResponse } from "next/server";
import { serverDb } from "../../../../lib/supabase";
import { requireAdmin } from "../../../../lib/auth";
import { KNOWN_SOURCES } from "../../../../lib/source-health";

interface Config {
  per_source_limit: number;
  concurrency: number;
  enabled_sources: string[];
  min_interval_hours: number;
}

function parseConfig(body: unknown): Config | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const perSourceLimit = Number(b["per_source_limit"]);
  const concurrency = Number(b["concurrency"]);
  const minIntervalHours = Number(b["min_interval_hours"] ?? 0);
  if (!Number.isInteger(perSourceLimit) || perSourceLimit < 0) return null;
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 5) return null;
  if (!Number.isInteger(minIntervalHours) || minIntervalHours < 0) return null;

  // Eski istemciler (veya testler) bu alanı hiç göndermeyebilir — o zaman "hepsi açık" varsayılır,
  // per_source_limit/concurrency'nin aksine burada eksik alan reddedilmez.
  const rawSources = b["enabled_sources"];
  const enabledSources = Array.isArray(rawSources)
    ? rawSources.filter((s): s is string => typeof s === "string" && (KNOWN_SOURCES as readonly string[]).includes(s))
    : [...KNOWN_SOURCES];

  return { per_source_limit: perSourceLimit, concurrency, enabled_sources: enabledSources, min_interval_hours: minIntervalHours };
}

/** Admin-only: yeni toplama-ayarı versiyonu kaydeder, aktif olarak işaretler (eski versiyonlar durur — rollback için). */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "yetki gerekli (admin)" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const config = parseConfig(body);
  if (!config) {
    return NextResponse.json({ ok: false, error: "geçersiz ayar gövdesi" }, { status: 400 });
  }

  const db = serverDb();
  if (!db) return NextResponse.json({ ok: false, error: "backend yapılandırılmadı" }, { status: 503 });

  const { count } = await db
    .from("ingestion_settings")
    .select("id", { count: "exact", head: true });
  const version = `v${(count ?? 0) + 1}`;

  const { error: deactivateError } = await db
    .from("ingestion_settings")
    .update({ is_active: false })
    .eq("is_active", true);
  if (deactivateError) {
    return NextResponse.json({ ok: false, error: deactivateError.message }, { status: 500 });
  }

  const { error: insertError } = await db.from("ingestion_settings").insert({
    version,
    config,
    is_active: true,
    created_by: admin.username,
  });
  if (insertError) {
    return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, version });
}
