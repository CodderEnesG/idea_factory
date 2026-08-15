"use client";

import { useState } from "react";
import type { IngestionSettings } from "../lib/active-ingestion-settings";

export function IngestionSettingsForm({
  initial,
  onSaved,
}: {
  initial: IngestionSettings;
  onSaved?: (settings: IngestionSettings) => void;
}) {
  const [perSourceLimit, setPerSourceLimit] = useState(initial.per_source_limit);
  const [concurrency, setConcurrency] = useState(initial.concurrency);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<"ok" | "err" | null>(null);

  async function save() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/ingestion-settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ per_source_limit: perSourceLimit, concurrency }),
      });
      setResult(res.ok ? "ok" : "err");
      if (res.ok) {
        const j = (await res.json().catch(() => null)) as { version?: string } | null;
        onSaved?.({ version: j?.version ?? initial.version, per_source_limit: perSourceLimit, concurrency });
      }
    } catch {
      setResult("err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
          Kaynak başına üst sınır
        </label>
        <input
          type="number"
          min={0}
          value={perSourceLimit}
          onChange={(e) => setPerSourceLimit(Number(e.target.value))}
          className="glass w-full px-3 py-2 text-sm text-ink focus:outline-none"
        />
        <p className="mt-1 text-xs text-ink-muted">
          Her çekimde bir kaynaktan tutulacak azami sinyal sayısı (en yeniden eskiye). 0 =
          sınırsız — bugünkü davranış.
        </p>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
          Paralellik (hız)
        </label>
        <input
          type="number"
          min={1}
          max={5}
          value={concurrency}
          onChange={(e) => setConcurrency(Number(e.target.value))}
          className="glass w-full px-3 py-2 text-sm text-ink focus:outline-none"
        />
        <p className="mt-1 text-xs text-ink-muted">
          Kaç kaynağın aynı anda çekileceği (1-5). 1 = sıralı — bugünkü davranış. Yüksek değer
          çekimi hızlandırır ama kaynak sunucularına aynı anda daha fazla istek gider.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="btn-primary rounded-full px-5 py-2 text-sm disabled:opacity-50"
        >
          {busy ? "Kaydediliyor…" : "Yeni versiyon olarak kaydet"}
        </button>
        {result === "ok" && <span className="text-sm text-pursue">✓ kaydedildi</span>}
        {result === "err" && <span className="text-sm text-kill">kaydedilemedi</span>}
      </div>
    </div>
  );
}
