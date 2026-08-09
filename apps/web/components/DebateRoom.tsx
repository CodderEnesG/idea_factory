"use client";

import { useEffect, useRef, useState } from "react";
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

interface Progress {
  index: number;
  total: number;
  speaker: string | null;
  startedAt: number;
}

type StreamEvent =
  | { type: "progress"; index: number; total: number; speaker: string | null }
  | { type: "done"; debate: DebateView }
  | { type: "error"; error: string };

// Gerçek "progress" event'i her turda bir gelir (~15-30sn arayla) — aralarda çubuk sabit
// kalırsa donmuş gibi görünür. Bu yüzden gerçek checkpoint'ler arasını, o ana kadarki
// ortalama tur süresine göre yumuşakça enterpole ediyoruz; her gerçek event gelince anında
// doğru değere hizalanıp oradan devam eder — asla geri gitmez, bir sonraki adımı geçmez.
const DEFAULT_TURN_MS = 20000; // ilk tur bitmeden önce ortalama yok, kaba bir tahmin

function ProgressBar({ progress }: { progress: Progress }) {
  const checkpointRef = useRef({ index: progress.index, at: Date.now() });
  const [virtualIndex, setVirtualIndex] = useState(progress.index);

  useEffect(() => {
    checkpointRef.current = { index: progress.index, at: Date.now() };
    setVirtualIndex(progress.index);
  }, [progress.index]);

  useEffect(() => {
    const id = setInterval(() => {
      const { index, at } = checkpointRef.current;
      const avgTurnMs = index > 0 ? (Date.now() - progress.startedAt) / index : DEFAULT_TURN_MS;
      const fraction = Math.min(0.92, (Date.now() - at) / avgTurnMs);
      setVirtualIndex(Math.min(progress.total - 0.02, index + fraction));
    }, 250);
    return () => clearInterval(id);
  }, [progress.startedAt, progress.total]);

  const pct = Math.round((virtualIndex / progress.total) * 100);
  const elapsedMs = Date.now() - progress.startedAt;
  const etaSec =
    progress.index > 0
      ? Math.max(0, Math.round(((elapsedMs / progress.index) * (progress.total - progress.index)) / 1000))
      : null;
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-[10px] text-ink-muted">
        <span>
          {progress.index}/{progress.total} tur {progress.speaker && `· ${progress.speaker} konuşuyor`}
        </span>
        <span>
          %{pct}
          {etaSec !== null && ` · ~${etaSec}sn kaldı`}
        </span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-hair">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Admin-only: AI Yorumcusu — çok-ajanlı tartışma odası. Geçmiş tartışmalar + yeni tetikleme. */
export function DebateRoom({ signalId, initial }: { signalId: string; initial: DebateView[] }) {
  const [debates, setDebates] = useState(initial);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = progress !== null;

  async function start() {
    setError(null);
    const startedAt = Date.now();
    // 7 = DEBATE_TOTAL_TURNS (packages/core/debate.ts) — sabit tekrarlanmış, client bundle'ı
    // @idea-factory/core'a bağlamamak için (core node:crypto zincirler, bkz. card-view.ts).
    // İlk "progress" event'i (index:0) gelince zaten sunucudan gerçek total üzerine yazılır.
    setProgress({ index: 0, total: 7, speaker: null, startedAt });

    try {
      const res = await fetch("/api/admin/debates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ signal_id: signalId }),
      });
      const reader = res.body?.getReader();
      if (!res.ok || !reader) {
        setError("tartışma başarısız");
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let doneEventReceived = false;
      let errorReceived = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const evt = JSON.parse(line) as StreamEvent;
          if (evt.type === "progress") {
            setProgress({ index: evt.index, total: evt.total, speaker: evt.speaker, startedAt });
          } else if (evt.type === "done") {
            doneEventReceived = true;
            setDebates((ds) => [evt.debate, ...ds]);
          } else if (evt.type === "error") {
            errorReceived = true;
            setError(evt.error);
          }
        }
      }
      if (!doneEventReceived && !errorReceived) setError("tartışma yarıda kesildi");
    } catch {
      setError("tartışma başarısız");
    } finally {
      setProgress(null);
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
      {progress && <ProgressBar progress={progress} />}
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
