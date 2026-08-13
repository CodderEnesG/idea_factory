"use client";

import { useState } from "react";

export interface TaskItem {
  id: string;
  body: string;
  done: boolean;
  created_at: string;
}

export function TaskList({ signalId, initial = [] }: { signalId: string; initial?: TaskItem[] }) {
  const [items, setItems] = useState<TaskItem[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ signal_id: signalId, body }),
      });
      const j = (await res.json().catch(() => null)) as { task?: TaskItem } | null;
      if (j?.task) {
        setItems((p) => [...p, j.task as TaskItem]);
        setText("");
      }
    } catch {
      /* demo/hata: sessiz */
    } finally {
      setBusy(false);
    }
  }

  async function toggle(task: TaskItem) {
    const done = !task.done;
    setItems((p) => p.map((t) => (t.id === task.id ? { ...t, done } : t)));
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ done }),
      });
    } catch {
      /* demo/hata: iyimser durum kalır */
    }
  }

  return (
    <div className="mt-4 border-t border-white/[0.14] pt-3">
      <div className="font-mono text-xs font-medium text-ink-secondary">
        Sonraki adımlar ({items.filter((t) => !t.done).length}/{items.length})
      </div>
      {items.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {items.map((t) => (
            <li key={t.id} className="flex items-start gap-2 font-mono text-sm">
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => toggle(t)}
                className="mt-0.5 shrink-0 accent-brand"
              />
              <span className={t.done ? "text-ink-muted line-through" : "text-ink"}>{t.body}</span>
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
          placeholder="Görev ekle — ör. kurucuyla görüşme ayarla…"
          className="flex-1 rounded border border-white/[0.14] bg-elevated px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
        />
        <button
          onClick={add}
          disabled={busy || !text.trim()}
          className="rounded border border-white/[0.14] bg-elevated px-3 py-2 text-sm text-ink transition hover:border-brand hover:text-brand disabled:opacity-50"
        >
          Ekle
        </button>
      </div>
    </div>
  );
}
