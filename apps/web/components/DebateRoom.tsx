"use client";

import { useEffect, useRef, useState } from "react";
import type { DebateView, DebateTurnView } from "../lib/card-view";
import { IconSparkle } from "./icons";

const VERDICT_LABEL: Record<string, string> = { pursue: "KOVALA", watch: "İZLE", kill: "ELE" };
const VERDICT_TEXT: Record<string, string> = {
  pursue: "text-pursue",
  watch: "text-watch",
  kill: "text-kill",
};

/** Bir tartışma turu — genişletilmiş transkriptte gösterilir. Konuşmacı/gerekçe/kanıt
 *  okunaklı olsun diye yorum balonlarıyla aynı taban boyutu (text-sm) kullanıyor. */
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
        <div className="mt-1 text-xs text-ink-muted">↳ itiraz: {turn.rebuts.join(", ")}</div>
      )}
      <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">{turn.message}</p>
      {turn.evidence.length > 0 && (
        <ul className="mt-1.5 space-y-1">
          {turn.evidence.map((e, i) => (
            <li key={i} className="text-xs text-ink-muted">
              · {e.fact} <span className="opacity-70">({e.source})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** AI Yorumcusu'nun sonucu — diğer yorumlarla aynı sohbet-balonu iskeleti (avatar + isim +
 *  tarih + balon, bkz. `CommentFeed`), yalnız avatar kişi baş harfi yerine yapay zekayı
 *  ayırt etsin diye ışıltı ikonu taşıyor. Tam transkript (tur tur gerekçe/kanıt) varsayılan
 *  gizli — "detayları göster" ile genişliyor, tekrar okumak isteyene okunaklı kalsın diye
 *  `TurnCard` metinleri sohbet balonlarıyla aynı `text-sm` taban boyutunu kullanıyor. */
function DebateTranscript({ debate }: { debate: DebateView }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-start gap-2.5">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand2 text-white">
        <IconSparkle className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1 rounded-lg border border-white/[0.1] bg-white/[0.03] px-3.5 py-2.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-xs font-semibold text-ink">AI Yorumcusu</span>
          <span className={`text-[10px] font-semibold ${VERDICT_TEXT[debate.final_verdict] ?? ""}`}>
            {VERDICT_LABEL[debate.final_verdict] ?? debate.final_verdict}
          </span>
          <span className="font-mono text-[10px] text-ink-muted">
            {new Date(debate.created_at).toLocaleString("tr-TR")}
          </span>
        </div>
        <div className="text-[10px] text-ink-muted">{debate.created_by} başlattı</div>
        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary">
          {debate.final_commentary}
        </p>
        <button
          onClick={() => setOpen((v) => !v)}
          className="mt-2 text-xs font-medium text-brand hover:underline"
        >
          {open ? "Tartışmanın tamamını gizle ▴" : `Tartışmanın tamamını gör — ${debate.transcript.length} tur ▾`}
        </button>
        {open && (
          <div className="mt-3 space-y-2 border-t border-hair pt-3">
            {debate.transcript.map((t, i) => (
              <TurnCard key={i} turn={t} />
            ))}
          </div>
        )}
      </div>
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
  // avgTurnMs checkpoint anında DONDURULUR (canlı Date.now() ile yeniden hesaplanmaz) —
  // aksi halde mevcut tur uzadıkça ortalama şişer, geri sayım yerine sürekli büyür.
  const checkpointRef = useRef({
    index: progress.index,
    at: Date.now(),
    avgTurnMs: DEFAULT_TURN_MS,
  });
  const [virtualIndex, setVirtualIndex] = useState(progress.index);
  const [etaSec, setEtaSec] = useState<number | null>(null);

  useEffect(() => {
    const now = Date.now();
    const avgTurnMs =
      progress.index > 0 ? (now - progress.startedAt) / progress.index : DEFAULT_TURN_MS;
    checkpointRef.current = { index: progress.index, at: now, avgTurnMs };
    setVirtualIndex(progress.index);
  }, [progress.index, progress.startedAt]);

  useEffect(() => {
    const id = setInterval(() => {
      const { index, at, avgTurnMs } = checkpointRef.current;
      const sinceCheckpoint = Date.now() - at;
      const fraction = Math.min(0.92, sinceCheckpoint / avgTurnMs);
      setVirtualIndex(Math.min(progress.total - 0.02, index + fraction));
      setEtaSec(
        index > 0
          ? Math.max(0, Math.round((avgTurnMs * (progress.total - index) - sinceCheckpoint) / 1000))
          : null,
      );
    }, 250);
    return () => clearInterval(id);
  }, [progress.total]);

  const pct = Math.round((virtualIndex / progress.total) * 100);
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

/** Tartışma verisi + tetikleme mantığı — hem tam `DebateRoom` bileşeni hem de Kuyruk'un
 *  composer düzeni (`DetailPanel`, tetikleyici composer'da) bunu paylaşır. Admin-only
 *  gating çağıran taraftan yapılır (`item.isAdmin`). */
export function useDebate(signalId: string, initial: DebateView[]) {
  const [debates, setDebates] = useState(initial);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = progress !== null;

  // Aynı bug `useComments`'te de vardı (bkz. Comments.tsx) — `DetailPanel` sinyal
  // değişince yeniden mount olmuyor, `useState(initial)` yalnız ilk mount'ta geçerli.
  // `signalId` değişince tazele; `initial`'ı KASITLI OLARAK dependency'e koyma.
  useEffect(() => {
    setDebates(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signalId]);

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

  return { debates, progress, error, busy, start };
}

/** Sade akış görünümü (tetikleyici buton yok) — Kuyruk'un composer düzeni için. */
export function DebateFeed({
  debates,
  progress,
  error,
}: {
  debates: DebateView[];
  progress: Progress | null;
  error: string | null;
}) {
  if (debates.length === 0 && !progress && !error) return null;
  return (
    <div>
      {progress && <ProgressBar progress={progress} />}
      {error && <p className="mt-1 text-xs text-kill">{error}</p>}
      {debates.length > 0 && (
        <div className="mt-2 space-y-3">
          {debates.map((d) => (
            <DebateTranscript key={d.id} debate={d} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Admin-only: AI Yorumcusu — çok-ajanlı tartışma odası. Kendi kendine yeten (tetikleyici +
 *  akış) — Panom kartlarında kullanılıyor. */
export function DebateRoom({ signalId, initial }: { signalId: string; initial: DebateView[] }) {
  const { debates, progress, error, busy, start } = useDebate(signalId, initial);
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
      <DebateFeed debates={debates} progress={progress} error={error} />
    </div>
  );
}
