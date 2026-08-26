"use client";

import { useState } from "react";

export interface TaskItem {
  id: string;
  body: string;
  done: boolean;
  /** Görevi ekleyen kullanıcı — liste artık ekipçe görünür (FAZ6_PLAN.md §Faz 6.1). */
  owner?: string;
  created_at: string;
}

/**
 * Sinyal başına ekip checklist'i.
 *
 * Yetki modeli (kasıtlı asimetri, FAZ6_PLAN.md §Faz 6.2): `done` işaretini HERKES
 * değiştirebilir — 3 şablon görev Kovala'ya ilk basanın üstünde kalıyor ve ekip onları
 * tamamlayabilmeli. Metni düzenlemek ve silmek yalnız sahibinde (ya da admin'de);
 * sunucu tarafı `api/tasks/[taskId]` bunu ayrıca doğruluyor.
 */
export function TaskList({
  signalId,
  initial = [],
  meName,
  canManage,
}: {
  signalId: string;
  initial?: TaskItem[];
  meName?: string;
  canManage?: boolean;
}) {
  const [items, setItems] = useState<TaskItem[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  async function add(bodyArg?: string) {
    const body = (bodyArg ?? text).trim();
    if (!body || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ signal_id: signalId, body }),
      });
      const j = (await res.json().catch(() => null)) as { task?: TaskItem; error?: string } | null;
      if (!res.ok || !j?.task) {
        setErr(j?.error ?? "görev eklenemedi");
        return;
      }
      setItems((p) => [...p, j.task as TaskItem]);
      if (!bodyArg) setText("");
    } catch {
      setErr("görev eklenemedi (bağlantı)");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(task: TaskItem) {
    const done = !task.done;
    const wasDone = task.done;
    setItems((p) => p.map((t) => (t.id === task.id ? { ...t, done } : t)));
    setErr(null);
    // Geri alma YALNIZ bu satırı geri alır, tüm listeyi eski hâline döndürmez: iki toggle
    // üst üste binerse tam-liste rollback'i ikinci işlemin iyimser durumunu da siler.
    const rollback = () => setItems((p) => p.map((t) => (t.id === task.id ? { ...t, done: wasDone } : t)));
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ done }),
      });
      // Eskiden iyimser durum hatada da kalıyordu — kutucuk işaretli görünüp aslında
      // kaydedilmemiş oluyordu, yani UI durum hakkında yalan söylüyordu.
      if (!res.ok) {
        rollback();
        setErr("kaydedilemedi");
      }
    } catch {
      rollback();
      setErr("kaydedilemedi (bağlantı)");
    }
  }

  async function saveEdit(task: TaskItem) {
    const body = draft.trim();
    if (!body || body === task.body) {
      setEditing(null);
      return;
    }
    const prevBody = task.body;
    setItems((p) => p.map((t) => (t.id === task.id ? { ...t, body } : t)));
    setEditing(null);
    setErr(null);
    const rollback = () => setItems((p) => p.map((t) => (t.id === task.id ? { ...t, body: prevBody } : t)));
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        rollback();
        setErr("düzenleme kaydedilemedi");
      }
    } catch {
      rollback();
      setErr("düzenleme kaydedilemedi (bağlantı)");
    }
  }

  async function remove(task: TaskItem) {
    // Silinen satırı eski sırasına geri koy — tüm listeyi geri yüklemek, bu sırada eklenmiş
    // ya da işaretlenmiş başka görevleri kaybettirirdi.
    const index = items.findIndex((t) => t.id === task.id);
    setItems((p) => p.filter((t) => t.id !== task.id));
    setErr(null);
    const rollback = () =>
      setItems((p) => {
        if (p.some((t) => t.id === task.id)) return p;
        const next = [...p];
        next.splice(Math.min(index, next.length), 0, task);
        return next;
      });
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (!res.ok) {
        rollback();
        setErr("silinemedi");
      }
    } catch {
      rollback();
      setErr("silinemedi (bağlantı)");
    }
  }

  function mayManage(t: TaskItem): boolean {
    if (canManage) return true;
    if (!t.owner || !meName) return true; // demo / owner bilgisi yok
    return t.owner === meName;
  }

  return (
    <div className="mt-4 border-t border-white/[0.14] pt-3">
      <div className="font-mono text-xs font-medium text-ink-secondary">
        Sonraki adımlar ({items.filter((t) => !t.done).length}/{items.length})
      </div>
      {items.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {items.map((t) => (
            <li key={t.id} className="group flex items-start gap-2 font-mono text-sm">
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => toggle(t)}
                className="mt-0.5 shrink-0 accent-brand"
              />
              {editing === t.id ? (
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => saveEdit(t)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      saveEdit(t);
                    }
                    if (e.key === "Escape") setEditing(null);
                  }}
                  className="flex-1 rounded border border-brand/50 bg-elevated px-2 py-0.5 text-sm text-ink"
                />
              ) : (
                <span
                  className={`flex-1 ${t.done ? "text-ink-muted line-through" : "text-ink"} ${
                    mayManage(t) ? "cursor-text" : ""
                  }`}
                  onDoubleClick={() => {
                    if (!mayManage(t)) return;
                    setDraft(t.body);
                    setEditing(t.id);
                  }}
                  title={mayManage(t) ? "düzenlemek için çift tıkla" : undefined}
                >
                  {t.body}
                </span>
              )}
              {t.owner && (
                <span
                  className="mt-0.5 shrink-0 text-[10px] uppercase tracking-wide text-ink-muted"
                  title={`ekleyen: ${t.owner}`}
                >
                  {t.owner === meName ? "sen" : t.owner}
                </span>
              )}
              {mayManage(t) && editing !== t.id && (
                <button
                  onClick={() => remove(t)}
                  aria-label="görevi sil"
                  className="shrink-0 px-1 text-ink-muted opacity-0 transition hover:text-kill group-hover:opacity-100"
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {err && <div className="mt-1.5 font-mono text-xs text-kill">{err}</div>}
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
          onClick={() => add()}
          disabled={busy || !text.trim()}
          className="rounded border border-white/[0.14] bg-elevated px-3 py-2 text-sm text-ink transition hover:border-brand hover:text-brand disabled:opacity-50"
        >
          Ekle
        </button>
      </div>
    </div>
  );
}
