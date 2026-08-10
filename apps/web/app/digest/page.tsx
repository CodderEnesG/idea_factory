import Link from "next/link";
import { getSession } from "../../lib/auth";
import { loadDigests } from "../../lib/load-digests";
import { Navbar } from "../../components/Navbar";

export const dynamic = "force-dynamic";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DigestPage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const [digests, me] = await Promise.all([loadDigests(), getSession()]);
  const selected = digests.find((d) => d.id === searchParams.id) ?? digests[0] ?? null;

  return (
    <div>
      <Navbar me={me} current="digest" />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <header className="mb-6">
          <h1 className="font-display text-3xl font-bold">Digest</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            {digests.length > 0
              ? `${digests.length} çalıştırma — dağıtım artık lokal dosya/CI artifact değil, burada kalıcı.`
              : "Henüz digest çalıştırılmamış."}
          </p>
        </header>

        {digests.length === 0 ? (
          <div className="glass p-6 text-sm text-ink-muted">
            Henüz kayıtlı digest yok. <code>pnpm digest</code> (veya <code>pnpm tick</code>) ile
            üret — her çalıştırma buraya otomatik kaydedilir.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
            <div className="glass p-3">
              <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Geçmiş
              </h2>
              <div className="space-y-1">
                {digests.map((d) => (
                  <Link
                    key={d.id}
                    href={`/digest?id=${d.id}`}
                    className={`block rounded-btn px-2 py-1.5 text-xs ${
                      selected?.id === d.id
                        ? "bg-elevated text-ink"
                        : "text-ink-secondary hover:bg-elevated hover:text-ink"
                    }`}
                  >
                    <div>{fmtDate(d.created_at)}</div>
                    <div className="text-ink-muted">
                      {d.item_count} sinyal{d.bench_count > 0 ? ` · 🏅 ${d.bench_count}` : ""}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="glass overflow-x-auto p-4">
              <pre className="whitespace-pre-wrap text-sm text-ink">{selected?.markdown}</pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
