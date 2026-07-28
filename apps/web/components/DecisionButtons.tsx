"use client";

import { useState } from "react";

export type Decision = "pursue" | "watch" | "kill";

export interface UserDecision {
  user: string;
  decision: Decision;
}

const OPTS: { d: Decision; label: string; cls: string }[] = [
  { d: "pursue", label: "Kovala", cls: "hover:border-pursue hover:text-pursue" },
  { d: "watch", label: "İzle", cls: "hover:border-watch hover:text-watch" },
  { d: "kill", label: "Ele", cls: "hover:border-kill hover:text-kill" },
];

const CHOSEN: Record<Decision, string> = {
  pursue: "border-pursue text-pursue",
  watch: "border-watch text-watch",
  kill: "border-kill text-kill",
};

const LABEL: Record<Decision, string> = { pursue: "Kovala", watch: "İzle", kill: "Ele" };

export function DecisionButtons({
  signalId,
  mine = null,
  others = [],
}: {
  signalId: string;
  mine?: Decision | null;
  others?: UserDecision[];
}) {
  const [chosen, setChosen] = useState<Decision | null>(mine);
  const [busy, setBusy] = useState(false);

  async function decide(d: Decision) {
    setBusy(true);
    setChosen(d);
    try {
      await fetch("/api/decisions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ signal_id: signalId, decision: d }),
      });
    } catch {
      // demo modunda sessiz — backend gelince gerçek yazar
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {OPTS.map((o) => (
          <button
            key={o.d}
            disabled={busy}
            onClick={() => decide(o.d)}
            className={`rounded-btn border bg-elevated px-4 py-2 text-sm text-ink transition disabled:opacity-50 ${
              chosen === o.d ? CHOSEN[o.d] : `border-hair ${o.cls}`
            }`}
          >
            {o.label}
            {chosen === o.d ? " ✓" : ""}
          </button>
        ))}
      </div>
      {others.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
          <span>ekip:</span>
          {others.map((o) => (
            <span key={o.user} className={`chip ${CHOSEN[o.decision]}`}>
              {o.user}: {LABEL[o.decision]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
