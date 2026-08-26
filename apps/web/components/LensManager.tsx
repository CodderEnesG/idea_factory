"use client";

import { useState } from "react";
import { TagListInput } from "./TagListInput";

export interface LensRow {
  lens_id: string;
  name: string;
  weight: number;
  extra_note_label: string;
  questions: string[];
  active: boolean;
  /** 0015: analiz öncesi canlı web araması yapılsın mı (pahalı — mercek başına açılır). */
  grounding?: boolean;
  created_by: string;
  created_at: string;
}

function LensCard({ row, onSaved }: { row: LensRow; onSaved: (r: LensRow) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(row.name);
  const [weight, setWeight] = useState(row.weight);
  const [extraNoteLabel, setExtraNoteLabel] = useState(row.extra_note_label);
  const [questions, setQuestions] = useState(row.questions);
  const [grounding, setGrounding] = useState(row.grounding ?? false);
  const [busy, setBusy] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/lenses/${row.lens_id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) onSaved({ ...row, ...body } as LensRow);
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive() {
    await patch({ active: !row.active });
  }

  async function saveEdit() {
    await patch({ name, weight, extra_note_label: extraNoteLabel, questions, grounding });
    setEditing(false);
  }

  return (
    <div className="glass p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-bold">{row.name}</span>
            <span className="chip text-[10px]">ağırlık {row.weight}</span>
            {row.grounding && (
              <span className="chip text-[10px] text-brand" title="Analiz öncesi canlı web araması yapılır (3 sorgu, ek maliyet)">
                canlı arama
              </span>
            )}
            {!row.active && <span className="chip text-[10px] text-kill">pasif</span>}
          </div>
          <p className="mt-0.5 text-xs text-ink-muted">
            not etiketi: {row.extra_note_label} · {row.created_by}
          </p>
        </div>
        <div className="flex shrink-0 gap-2 text-xs">
          <button
            disabled={busy}
            onClick={() => setEditing((v) => !v)}
            className="btn-ghost rounded-full px-3 py-1"
          >
            {editing ? "kapat" : "düzenle"}
          </button>
          <button
            disabled={busy}
            onClick={toggleActive}
            className="btn-ghost rounded-full px-3 py-1"
          >
            {row.active ? "pasifleştir" : "etkinleştir"}
          </button>
        </div>
      </div>

      {!editing && (
        <ul className="mt-3 space-y-1 text-xs text-ink-secondary">
          {row.questions.map((q, i) => (
            <li key={i}>
              {i + 1}. {q}
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <div className="mt-3 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="mercek adı"
            className="glass w-full px-3 py-2 text-sm text-ink focus:outline-none"
          />
          <div className="flex gap-3">
            <input
              type="number"
              min={0}
              step={0.1}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="glass w-24 px-3 py-2 text-sm text-ink focus:outline-none"
            />
            <input
              value={extraNoteLabel}
              onChange={(e) => setExtraNoteLabel(e.target.value)}
              placeholder="not etiketi (ör. Zamanlama notu)"
              className="glass flex-1 px-3 py-2 text-sm text-ink focus:outline-none"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-ink-secondary">
            <input
              type="checkbox"
              checked={grounding}
              onChange={(e) => setGrounding(e.target.checked)}
              className="accent-brand"
            />
            Canlı web araması (grounding) — analizden önce 3 hedefli arama yapılır. Rekabet/
            pazar sorusu soran mercekler için; kanıt sorusu soranlarda ölçüldü, zarar veriyor.
          </label>
          <TagListInput
            label="Domain soruları (sırayla sorulur)"
            values={questions}
            onChange={setQuestions}
            placeholder="soru yaz, Enter ile ekle"
          />
          <button
            disabled={busy || !name.trim() || !extraNoteLabel.trim() || questions.length === 0}
            onClick={saveEdit}
            className="btn-primary rounded-full px-4 py-1.5 text-xs disabled:opacity-50"
          >
            kaydet
          </button>
        </div>
      )}
    </div>
  );
}

function NewLensForm({ onCreated }: { onCreated: (r: LensRow) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [weight, setWeight] = useState(1);
  const [extraNoteLabel, setExtraNoteLabel] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim() && extraNoteLabel.trim() && questions.length > 0;

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/lenses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, weight, extra_note_label: extraNoteLabel, questions }),
      });
      const json = (await res.json()) as { ok: boolean; lens_id?: string; error?: string };
      if (!res.ok || !json.ok || !json.lens_id) {
        setError(json.error ?? "kaydedilemedi");
        return;
      }
      onCreated({
        lens_id: json.lens_id,
        name,
        weight,
        extra_note_label: extraNoteLabel,
        questions,
        active: true,
        created_by: "sen",
        created_at: new Date().toISOString(),
      });
      setName("");
      setWeight(1);
      setExtraNoteLabel("");
      setQuestions([]);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary rounded-full px-4 py-2 text-sm">
        + yeni mercek ekle
      </button>
    );
  }

  return (
    <div className="glass space-y-3 p-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="mercek adı (ör. Zamanlama)"
        className="glass w-full px-3 py-2 text-sm text-ink focus:outline-none"
      />
      <div className="flex gap-3">
        <input
          type="number"
          min={0}
          step={0.1}
          value={weight}
          onChange={(e) => setWeight(Number(e.target.value))}
          className="glass w-24 px-3 py-2 text-sm text-ink focus:outline-none"
        />
        <input
          value={extraNoteLabel}
          onChange={(e) => setExtraNoteLabel(e.target.value)}
          placeholder="not etiketi (ör. Zamanlama notu)"
          className="glass flex-1 px-3 py-2 text-sm text-ink focus:outline-none"
        />
      </div>
      <TagListInput
        label="Domain soruları (sırayla sorulur)"
        values={questions}
        onChange={setQuestions}
        placeholder="soru yaz, Enter ile ekle"
      />
      {error && <p className="text-xs text-kill">{error}</p>}
      <div className="flex gap-2">
        <button
          disabled={busy || !valid}
          onClick={create}
          className="btn-primary rounded-full px-4 py-1.5 text-xs disabled:opacity-50"
        >
          {busy ? "kaydediliyor…" : "kaydet"}
        </button>
        <button onClick={() => setOpen(false)} className="btn-ghost rounded-full px-4 py-1.5 text-xs">
          vazgeç
        </button>
      </div>
    </div>
  );
}

export function LensManager({ initial }: { initial: LensRow[] }) {
  const [rows, setRows] = useState(initial);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {rows.length === 0 && (
          <p className="text-sm text-ink-muted">Henüz mercek eklenmedi.</p>
        )}
        {rows.map((r) => (
          <LensCard
            key={r.lens_id}
            row={r}
            onSaved={(next) => setRows((rs) => rs.map((x) => (x.lens_id === next.lens_id ? next : x)))}
          />
        ))}
      </div>

      <NewLensForm onCreated={(r) => setRows((rs) => [...rs, r])} />
    </div>
  );
}
