"use client";

import { useState } from "react";

export interface Comment {
  id: string;
  author: string;
  body: string;
  created_at: string;
}

function fmt(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

export function Comments({ signalId, initial = [] }: { signalId: string; initial?: Comment[] }) {
  const [items, setItems] = useState<Comment[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ signal_id: signalId, body }),
      });
      const j = (await res.json().catch(() => null)) as { comment?: Comment } | null;
      if (j?.comment) {
        setItems((p) => [...p, j.comment as Comment]);
        setText("");
      }
    } catch {
      /* demo/hata: sessiz */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 border-t border-hair pt-3">
      <div className="text-xs font-medium text-ink-secondary">Yorumlar ({items.length})</div>
      {items.length > 0 && (
        <ul className="mt-2 space-y-2">
          {items.map((c) => (
            <li key={c.id} className="text-xs">
              <span className="text-ink">{c.author}</span>
              <span className="text-ink-muted"> · {fmt(c.created_at)}</span>
              <div className="mt-0.5 whitespace-pre-wrap text-ink-secondary">{c.body}</div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Yorum ekle…"
          className="flex-1 rounded-btn border border-hair bg-elevated px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
        />
        <button
          onClick={add}
          disabled={busy || !text.trim()}
          className="rounded-btn border border-hair bg-elevated px-3 py-2 text-sm text-ink transition hover:border-brand hover:text-brand disabled:opacity-50"
        >
          Ekle
        </button>
      </div>
    </div>
  );
}
