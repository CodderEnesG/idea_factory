import { runDebate, DEBATE_TOTAL_TURNS, type Signal } from "@idea-factory/core";
import { serverDb } from "../../../../lib/supabase";
import { requireAdmin } from "../../../../lib/auth";
import { loadActiveThesis } from "../../../../lib/active-thesis";

export const runtime = "nodejs"; // sabit 7 LLM çağrısı — Edge süre sınırına takılmasın

function jsonError(error: string, status: number): Response {
  return new Response(JSON.stringify({ ok: false, error }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * Admin-only: AI Yorumcusu — bir sinyal için çok-ajanlı tartışma tetikler (analyses'a değil,
 * ayrı debates tablosuna yazar). NDJSON stream: her tur bitince bir "progress" satırı, en sonda
 * "done" (veya hata olursa "error") — DebateRoom.tsx ilerleme çubuğu bunu okur.
 */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return jsonError("yetki gerekli (admin)", 403);

  const body = (await req.json().catch(() => null)) as { signal_id?: string } | null;
  if (!body?.signal_id) return jsonError("signal_id gerekli", 400);

  const db = serverDb();
  if (!db) return jsonError("backend yapılandırılmadı", 503);

  const { data: signal, error: signalError } = await db
    .from("signals")
    .select("*")
    .eq("id", body.signal_id)
    .maybeSingle();
  if (signalError || !signal) return jsonError("sinyal bulunamadı", 404);

  const thesis = await loadActiveThesis();
  const signalId = body.signal_id;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const write = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      write({ type: "progress", index: 0, total: DEBATE_TOTAL_TURNS, speaker: null });

      try {
        const result = await runDebate(signal as Signal, {
          thesis,
          onTurn: (info) => write({ type: "progress", ...info }),
        });

        const { data: inserted, error: insertError } = await db
          .from("debates")
          .insert({
            signal_id: signalId,
            created_by: admin.username,
            transcript: result.transcript,
            final_verdict: result.final_verdict,
            final_commentary: result.final_commentary,
          })
          .select("id, transcript, final_verdict, final_commentary, created_by, created_at")
          .single();

        if (insertError || !inserted) {
          write({ type: "error", error: insertError?.message ?? "kayıt hatası" });
        } else {
          write({ type: "done", debate: inserted });
        }
      } catch (e) {
        write({ type: "error", error: e instanceof Error ? e.message : "tartışma başarısız" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "content-type": "application/x-ndjson", "cache-control": "no-store" },
  });
}
