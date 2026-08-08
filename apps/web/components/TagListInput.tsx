"use client";

import { useState } from "react";

/** Basit etiket-listesi editörü — Enter/virgülle ekler, çarpıyla siler. Faz 3-B/3-C paylaşır. */
export function TagListInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const v = draft.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft("");
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">{label}</label>
      <div className="glass flex flex-wrap items-center gap-1.5 p-2">
        {values.map((v) => (
          <span key={v} className="chip flex items-center gap-1.5">
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="text-ink-muted hover:text-kill"
              aria-label={`${v} sil`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => {
            if (e.target.value.endsWith(",")) {
              setDraft(e.target.value.slice(0, -1));
              commit();
              return;
            }
            setDraft(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Backspace" && draft === "" && values.length > 0) {
              onChange(values.slice(0, -1));
            }
          }}
          onBlur={commit}
          placeholder={placeholder ?? "yaz, Enter/virgül ile ekle"}
          className="min-w-[140px] flex-1 bg-transparent px-1 py-1 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
        />
      </div>
    </div>
  );
}
