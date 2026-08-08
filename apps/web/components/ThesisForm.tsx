"use client";

import { useState } from "react";
import type { ThesisConfig } from "@idea-factory/core";
import { TagListInput } from "./TagListInput";

export function ThesisForm({ initial }: { initial: ThesisConfig }) {
  const [capitalRange, setCapitalRange] = useState(initial.capital_range);
  const [riskAppetite, setRiskAppetite] = useState(initial.risk_appetite);
  const [targetMarkets, setTargetMarkets] = useState(initial.target_markets);
  const [sectors, setSectors] = useState(initial.sectors);
  const [capabilities, setCapabilities] = useState(initial.capabilities);
  const [antiPatterns, setAntiPatterns] = useState(initial.anti_patterns);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<"ok" | "err" | null>(null);

  const valid =
    capitalRange.trim() && riskAppetite.trim() && targetMarkets.length > 0 && sectors.length > 0 &&
    capabilities.length > 0;

  async function save() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/thesis", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          capital_range: capitalRange,
          risk_appetite: riskAppetite,
          target_markets: targetMarkets,
          sectors,
          capabilities,
          anti_patterns: antiPatterns,
        }),
      });
      setResult(res.ok ? "ok" : "err");
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
          Sermaye aralığı
        </label>
        <input
          value={capitalRange}
          onChange={(e) => setCapitalRange(e.target.value)}
          className="glass w-full px-3 py-2 text-sm text-ink focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
          Risk iştahı
        </label>
        <input
          value={riskAppetite}
          onChange={(e) => setRiskAppetite(e.target.value)}
          className="glass w-full px-3 py-2 text-sm text-ink focus:outline-none"
        />
      </div>
      <TagListInput label="Hedef pazarlar" values={targetMarkets} onChange={setTargetMarkets} />
      <TagListInput label="Sektörler" values={sectors} onChange={setSectors} />
      <TagListInput label="Yetkinlikler" values={capabilities} onChange={setCapabilities} />
      <TagListInput
        label="Anti-pattern'ler (opsiyonel)"
        values={antiPatterns}
        onChange={setAntiPatterns}
      />

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          disabled={busy || !valid}
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
