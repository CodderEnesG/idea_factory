import { serverDb } from "./supabase";
import type { Decision } from "../components/DecisionButtons";

export interface FinalDecision {
  decision: Decision;
  decidedBy: string;
  decidedAt: string;
  reason: string | null;
}

/**
 * Sinyal başına EN FAZLA bir "resmi/ekip" karar (0013_final_decisions.sql — kişisel
 * `decisions` log'undan ayrı, tek satır). Herkes kilitleyebilir/açabilir, bkz. api/decisions/final.
 */
export async function loadFinalDecisions(): Promise<Map<string, FinalDecision>> {
  const db = serverDb();
  const map = new Map<string, FinalDecision>();
  if (!db) return map;
  const { data, error } = await db
    .from("final_decisions")
    .select("signal_id, decision, decided_by, decided_at, reason");
  if (error || !data) return map;
  for (const row of data as {
    signal_id: string;
    decision: Decision;
    decided_by: string;
    decided_at: string;
    reason: string | null;
  }[]) {
    map.set(row.signal_id, {
      decision: row.decision,
      decidedBy: row.decided_by,
      decidedAt: row.decided_at,
      reason: row.reason,
    });
  }
  return map;
}
