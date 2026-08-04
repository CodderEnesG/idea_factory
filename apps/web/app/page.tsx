import Link from "next/link";

function Nav() {
  return (
    <nav className="flex items-center justify-between px-8 py-6">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-btn bg-brand text-brand-fg font-display font-bold">
          IF
        </div>
        <span className="font-display text-lg font-semibold tracking-tight">IdeaFact</span>
      </div>
      <div className="flex items-center gap-6 text-sm text-ink-secondary">
        <Link href="/queue" className="hover:text-ink">
          Kuyruk
        </Link>
        <Link href="/queue" className="btn-primary">
          Kuyruğu aç →
        </Link>
      </div>
    </nav>
  );
}

const LEGEND = [
  { k: "pursue", label: "KOVALA", color: "text-pursue", desc: "teze birebir uyum, yüksek güven" },
  { k: "watch", label: "İZLE", color: "text-watch", desc: "uyum var, kritik veri doğrulanmalı" },
  { k: "kill", label: "ELE", color: "text-kill", desc: "uyumsuz / anti-pattern" },
];

export default function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="glow-backdrop starfield pointer-events-none absolute inset-0" />
      <div className="relative">
        <Nav />

        <section className="mx-auto max-w-3xl px-6 pb-24 pt-24 text-center">
          <span className="chip mb-8">
            <span className="mr-2 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-brand-fg">
              Yeni
            </span>
            Arbitraj Merceği · Türkiye tezi
          </span>

          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Tezine göre sıralı, gerekçeli fırsatlar.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-ink-secondary">
            Sinyal içeri → şüpheci AI analist tezine göre puanlar → kovala / izle / ele kuyruğu
            dışarı. Doğru bahsi daha erken, daha az emekle.
          </p>

          <div className="mt-10 flex items-center justify-center gap-3">
            <Link href="/queue" className="btn-primary">
              Fırsat kuyruğunu aç →
            </Link>
            <a href="#nasil" className="btn-ghost">
              Nasıl çalışır
            </a>
          </div>
        </section>

        <section id="nasil" className="mx-auto max-w-4xl px-6 pb-32">
          <div className="grid gap-4 sm:grid-cols-3">
            {LEGEND.map((l) => (
              <div key={l.k} className="rounded-card border border-hair bg-surface p-6">
                <div className={`font-display text-sm font-semibold ${l.color}`}>● {l.label}</div>
                <p className="mt-2 text-sm text-ink-secondary">{l.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-ink-muted">
            Her skorun yanında gerekçe, güven düzeyi ve —belirsizse— doğrulama görevi. Gerekçesiz
            skor yayınlanmaz.
          </p>
        </section>
      </div>
    </main>
  );
}
