import type { KnowledgeLayer, Signal } from "@idea-factory/core";
import { db } from "../db.js";
import { buildNotes, type CommentRow, type DecisionRow } from "./knowledge.js";

// Küçük ekip/hacim (MVP) — alaka puanlamasını (sector/market örtüşmesi) SQL'de değil
// buildNotes'ta uygula; son N kaydı taramak yeter. Not: bu pencerenin kendisi hâlâ tazelik-
// sınırlı (son 200 kayıt) — havuz büyüyünce en alakalı ama eski bir kayıt pencere dışında
// kalabilir; gerçek çözüm (arama/embedding) gbrain ile faz 2.
const RECENT_LIMIT = 200;

/** decisions + comments'i sorgulayıp aynı sektör/pazardaki notları analiste bağlayan katman. */
export function supabaseKnowledgeLayer(): KnowledgeLayer {
  return {
    async getContext(signal: Signal) {
      if (!signal.sector && !signal.market) return { notes: [] };

      const [decisionsRes, commentsRes] = await Promise.all([
        db
          .from("decisions")
          .select("decision, note, decided_by, created_at, signal:signals(id, title, sector, market)")
          .neq("signal_id", signal.id)
          .order("created_at", { ascending: false })
          .limit(RECENT_LIMIT),
        db
          .from("comments")
          .select("body, author, created_at, signal:signals(id, title, sector, market)")
          .neq("signal_id", signal.id)
          .order("created_at", { ascending: false })
          .limit(RECENT_LIMIT),
      ]);
      if (decisionsRes.error) {
        throw new Error(`bilgi katmanı: decisions sorgu hatası: ${decisionsRes.error.message}`);
      }
      if (commentsRes.error) {
        throw new Error(`bilgi katmanı: comments sorgu hatası: ${commentsRes.error.message}`);
      }

      const notes = buildNotes(
        signal,
        (decisionsRes.data ?? []) as unknown as DecisionRow[],
        (commentsRes.data ?? []) as unknown as CommentRow[],
      );
      return { notes };
    },
  };
}
