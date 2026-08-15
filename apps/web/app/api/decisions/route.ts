import { NextResponse } from "next/server";
import { serverDb } from "../../../lib/supabase";
import { getSession } from "../../../lib/auth";
import { authEnabled } from "../../../lib/session";
import { PURSUE_STARTER_TASKS } from "../../../lib/task-templates";

const VALID = new Set(["pursue", "watch", "kill"]);

export async function POST(req: Request) {
  const session = await getSession();
  // İkinci katman (/cso #3): middleware zaten oturumsuz isteği engeller ama AUTH_SECRET
  // yanlışlıkla unutulursa (2026-08-04'teki okuma-sızıntısıyla aynı kök neden) bu route
  // tek başına da kapalı kalsın — yalnız middleware'e güvenme.
  if (authEnabled() && !session) {
    return NextResponse.json({ ok: false, error: "kimlik doğrulama gerekli" }, { status: 401 });
  }
  const decidedBy = session?.username ?? "web"; // auth kapalıysa (lokal/demo) anonim

  const body = (await req.json().catch(() => null)) as
    | { signal_id?: string; decision?: string }
    | null;
  if (!body?.signal_id || !body?.decision || !VALID.has(body.decision)) {
    return NextResponse.json({ ok: false, error: "geçersiz istek" }, { status: 400 });
  }

  const db = serverDb();
  if (!db) return NextResponse.json({ ok: true, demo: true }); // backend yok → no-op

  // append-only: her basış yeni satır (geçmiş = feedback). Okuma (sinyal,kullanıcı) başına en-yeni.
  const { error } = await db
    .from("decisions")
    .insert({ signal_id: body.signal_id, decision: body.decision, decided_by: decidedBy });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  // Problem 3 ("adım atma yönü güçsüz"): "kovala" ilk kez seçildiğinde boş checklist yerine
  // düzenlenebilir bir başlangıç. Yalnız bu (sinyal, kullanıcı) için hiç görev yoksa ekler —
  // kullanıcı sildiyse ya da zaten kendi görevlerini yazdıysa tekrar tekrar spam etmez.
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
