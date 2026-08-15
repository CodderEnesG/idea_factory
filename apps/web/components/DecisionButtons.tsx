"use client";

import { useState } from "react";
import { IconCheck } from "./icons";

export type Decision = "pursue" | "watch" | "kill";

export interface UserDecision {
  user: string;
  decision: Decision;
}

const OPTS: { d: Decision; label: string }[] = [
  { d: "pursue", label: "Kovala" },
  { d: "watch", label: "İzle" },
  { d: "kill", label: "Ele" },
];

// Marka imzası: karar anı = dolgulu, renkli pill (nötr kutucuk değil). Seçiliyken bant rengiyle
// dolar + hafif parıltı verir — "kaydedildi" hissi tek bakışta. watch (amber) beyaz metinle
// kontrast düşük olduğundan koyu metin kullanır.
const FILLED: Record<Decision, string> = {
  pursue: "bg-pursue text-white shadow-[0_0_20px_-4px_rgba(12,163,12,0.6)]",
  watch: "bg-watch text-canvas shadow-[0_0_20px_-4px_rgba(250,178,25,0.6)]",
  kill: "bg-kill text-white shadow-[0_0_20px_-4px_rgba(208,59,59,0.6)]",
};
const TINTED: Record<Decision, string> = {
  pursue: "bg-pursue/10 text-pursue hover:bg-pursue/20",
  watch: "bg-watch/10 text-watch hover:bg-watch/20",
  kill: "bg-kill/10 text-kill hover:bg-kill/20",
};

export function DecisionButtons({
  signalId,
  mine = null,
  onDecided,
  size = "sm",
}: {
  signalId: string;
  mine?: Decision | null;
  onDecided?: (d: Decision) => void;
  size?: "sm" | "lg";
}) {
  const [chosen, setChosen] = useState<Decision | null>(mine);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function decide(d: Decision) {
    setBusy(true);
    setFailed(false);
    const previous = chosen;
    setChosen(d);
    try {
      const res = await fetch("/api/decisions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ signal_id: signalId, decision: d }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onDecided?.(d);
    } catch {
      // Yazma gerçekten başarısız oldu (demo modu farklı — fetch orada da atılır ama
      // backend yoksa zaten çağıran bileşen demo veriyle çalışır) — optimistic işareti geri al,
      // kullanıcı kararının kaydedilmediğini görsün.
      setChosen(previous);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  const pad = size === "lg" ? "px-6 py-3.5 text-base" : "px-4 py-2.5 text-sm";

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        {OPTS.map((o) => {
          const isChosen = chosen === o.d;
          return (
            <button
              key={o.d}
              data-decision={o.d}
              disabled={busy}
              onClick={() => decide(o.d)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full font-display font-semibold transition disabled:opacity-50 ${pad} ${
                isChosen ? FILLED[o.d] : TINTED[o.d]
              }`}
            >
              {isChosen && <IconCheck className="h-4 w-4 shrink-0" strokeWidth={2.5} />}
              {o.label}
            </button>
          );
        })}
      </div>
      {failed && (
        <p className="text-xs text-kill">Karar kaydedilemedi, bağlantını kontrol edip tekrar dene.</p>
      )}
    </div>
  );
}
