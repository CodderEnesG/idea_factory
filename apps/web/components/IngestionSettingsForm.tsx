"use client";

import { useState } from "react";
import type { IngestionSettings } from "../lib/active-ingestion-settings";
import { formatSource } from "../lib/source-labels";

const KNOWN_SOURCES = ["producthunt", "tldr", "webrazzi", "techcrunch", "ycombinator"];

export function IngestionSettingsForm({
  initial,
  onSaved,
}: {
  initial: IngestionSettings;
  onSaved?: (settings: IngestionSettings) => void;
}) {
  const [perSourceLimit, setPerSourceLimit] = useState(initial.per_source_limit);
  const [concurrency, setConcurrency] = useState(initial.concurrency);
  const [enabledSources, setEnabledSources] = useState<Set<string>>(new Set(initial.enabled_sources));
  const [minIntervalHours, setMinIntervalHours] = useState(initial.min_interval_hours);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<"ok" | "err" | null>(null);
  const [triggerBusy, setTriggerBusy] = useState(false);
  const [triggerResult, setTriggerResult] = useState<"ok" | "err" | null>(null);

  function toggleSource(name: string) {
    setEnabledSources((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function save() {
    setBusy(true);
    setResult(null);
    try {
      const enabled_sources = [...enabledSources];
      const res = await fetch("/api/admin/ingestion-settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          per_source_limit: perSourceLimit,
          concurrency,
          enabled_sources,
          min_interval_hours: minIntervalHours,
        }),
      });
      setResult(res.ok ? "ok" : "err");
      if (res.ok) {
        const j = (await res.json().catch(() => null)) as { version?: string } | null;
        onSaved?.({
          version: j?.version ?? initial.version,
          per_source_limit: perSourceLimit,
          concurrency,
          enabled_sources,
          min_interval_hours: minIntervalHours,
        });
      }
    } catch {
      setResult("err");
    } finally {
      setBusy(false);
    }
  }

  async function triggerNow() {
    setTriggerBusy(true);
    setTriggerResult(null);
    try {
      const res = await fetch("/api/admin/trigger-ingest", { method: "POST" });
      setTriggerResult(res.ok ? "ok" : "err");
    } catch {
      setTriggerResult("err");
    } finally {
      setTriggerBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">Aktif kaynaklar</label>
        <div className="flex flex-wrap gap-1.5">
          {KNOWN_SOURCES.map((s) => {
            const active = enabledSources.has(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSource(s)}
                aria-pressed={active}
                className={`chip transition ${active ? "border-strong text-ink" : "text-ink-muted hover:text-ink"}`}
              >
                {formatSource(s)}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-xs text-ink-muted">
          Kapatılan kaynaktan bir sonraki çekimden itibaren sinyal gelmez. Hepsi kapalıysa çekim
          hiçbir şey yapmadan biter.
        </p>
      </div>

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

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
          İki çekim arası asgari süre (saat)
        </label>
        <input
          type="number"
          min={0}
          value={minIntervalHours}
          onChange={(e) => setMinIntervalHours(Number(e.target.value))}
          className="glass w-full px-3 py-2 text-sm text-ink focus:outline-none"
        />
        <p className="mt-1 text-xs text-ink-muted">
          0 = kapalı, her tetiklemede çeker. Gerçek üst sınır hâlâ GitHub Actions&apos;ın kendi
          zamanlamasına (şu an günde 2, 07:00/19:00 İstanbul) bağlı — bu ayar yalnız var olan
          tetiklemeleri seyreltir, sıklığı artıramaz.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
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

      <div className="border-t border-hair pt-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={triggerBusy}
            onClick={triggerNow}
            className="btn-ghost rounded-full px-5 py-2 text-sm disabled:opacity-50"
          >
            {triggerBusy ? "Başlatılıyor…" : "Şimdi çek"}
          </button>
          {triggerResult === "ok" && <span className="text-sm text-pursue">✓ başladı — birkaç dakika sürebilir</span>}
          {triggerResult === "err" && <span className="text-sm text-kill">başlatılamadı</span>}
        </div>
        <p className="mt-1.5 text-xs text-ink-muted">
          Cron&apos;u beklemeden anlık çekim başlatır. Yalnız lokalde (<code>pnpm dev</code>) veya
          kalıcı bir süreç altında çalışırken güvenilir — sunucusuz (Vercel) ortamda istek biter
          bitmez süreç yarım kalabilir.
        </p>
      </div>
    </div>
  );
}
