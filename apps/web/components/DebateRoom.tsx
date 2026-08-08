"use client";

import { useState } from "react";
import type { DebateView, DebateTurnView } from "../lib/card-view";

const VERDICT_LABEL: Record<string, string> = { pursue: "KOVALA", watch: "İZLE", kill: "ELE" };
const VERDICT_TEXT: Record<string, string> = {
  pursue: "text-pursue",
  watch: "text-watch",
  kill: "text-kill",
};

function TurnCard({ turn }: { turn: DebateTurnView }) {
  return (
    <div className="rounded-btn border border-hair bg-elevated p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-ink">{turn.speaker}</span>
        {turn.position && (
          <span className={`text-[10px] font-semibold ${VERDICT_TEXT[turn.position] ?? ""}`}>
            {VERDICT_LABEL[turn.position] ?? turn.position}
          </span>
        )}
      </div>
      {turn.rebuts.length > 0 && (
        <div className="mt-1 text-[10px] text-ink-muted">↳ itiraz: {turn.rebuts.join(", ")}</div>
      )}
      <p className="mt-1.5 text-xs leading-relaxed text-ink-secondary">{turn.message}</p>
      {turn.evidence.length > 0 && (
        <ul className="mt-1.5 space-y-0.5">
          {turn.evidence.map((e, i) => (
            <li key={i} className="text-[10px] text-ink-muted">
              · {e.fact} <span className="opacity-70">({e.source})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DebateTranscript({ debate }: { debate: DebateView }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-btn border border-hair bg-canvas/40 p-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-xs text-ink-secondary">
          <span className={`font-semibold ${VERDICT_TEXT[debate.final_verdict] ?? ""}`}>
            {VERDICT_LABEL[debate.final_verdict] ?? debate.final_verdict}
          </span>{" "}
          — {debate.final_commentary}
        </span>
        <span className="shrink-0 text-[10px] text-ink-muted">{open ? "kapat ▴" : "transkript ▾"}</span>
      </button>
      <div className="mt-1 text-[10px] text-ink-muted">
        {debate.created_by} · {new Date(debate.created_at).toLocaleString("tr-TR")}
      </div>
      {open && (
        <div className="mt-3 space-y-2">
          {debate.transcript.map((t, i) => (
            <TurnCard key={i} turn={t} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Admin-only: AI Yorumcusu — çok-ajanlı tartışma odası. Geçmiş tartışmalar + yeni tetikleme. */
export function DebateRoom({ signalId, initial }: { signalId: string; initial: DebateView[] }) {
  const [debates, setDebates] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/debates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ signal_id: signalId }),
      });
      const json = (await res.json()) as { ok: boolean; debate?: DebateView; error?: string };
      if (!res.ok || !json.ok || !json.debate) {
        setError(json.error ?? "tartışma başarısız");
        return;
      }
      setDebates((ds) => [json.debate!, ...ds]);
    } catch {
      setError("tartışma başarısız");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 border-t border-hair pt-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-muted">
          AI Yorumcusu {debates.length > 0 && `(${debates.length})`}
        </span>
        <button
          disabled={busy}
          onClick={start}
          className="btn-ghost rounded-full px-3 py-1 text-xs disabled:opacity-50"
        >
          {busy ? "tartışıyorlar…" : "AI Yorumcusu başlat"}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-kill">{error}</p>}
      {debates.length > 0 && (
        <div className="mt-2 space-y-2">
          {debates.map((d) => (
            <DebateTranscript key={d.id} debate={d} />
          ))}
        </div>
      )}
    </div>
  );
}
