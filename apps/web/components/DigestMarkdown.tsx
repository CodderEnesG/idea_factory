import type { ReactNode } from "react";

/** `buildDigest()` (packages/core/digest.ts) yalnız bu alt kümeyi üretir: #/##/###
 *  başlıklar, **bold**, _italic_, `- ` liste, `---` ayraç, çıplak URL satırı. Genel
 *  amaçlı bir markdown kütüphanesi yerine bu sabit alt kümeye özel, bağımlılıksız render. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|_[^_]+_)/g;
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={`${keyPrefix}-${i++}`} className="font-semibold text-ink">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      parts.push(
        <em key={`${keyPrefix}-${i++}`} className="text-ink-muted not-italic">
          {token.slice(1, -1)}
        </em>,
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function DigestMarkdown({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n");
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  function flushList() {
    if (listItems.length === 0) return;
    const items = listItems;
    listItems = [];
    blocks.push(
      <ul key={`ul-${key++}`} className="list-disc space-y-1.5 pl-5">
        {items.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed text-ink-secondary">
            {renderInline(item, `li-${key}-${i}`)}
          </li>
        ))}
      </ul>,
    );
  }

  for (const raw of lines) {
    const line = raw.trim();

    if (line.startsWith("- ")) {
      listItems.push(line.slice(2));
      continue;
    }
    flushList();

    if (line === "") continue;
    if (line === "---") {
      blocks.push(<hr key={`hr-${key++}`} className="my-4 border-hair" />);
    } else if (line.startsWith("### ")) {
      blocks.push(
        <h3 key={`h3-${key++}`} className="mt-5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {renderInline(line.slice(4), `h3-${key}`)}
        </h3>,
      );
    } else if (line.startsWith("## ")) {
      blocks.push(
        <h2 key={`h2-${key++}`} className="mt-6 font-display text-base font-semibold text-ink">
          {renderInline(line.slice(3), `h2-${key}`)}
        </h2>,
      );
    } else if (line.startsWith("# ")) {
      blocks.push(
        <h1 key={`h1-${key++}`} className="font-display text-2xl font-bold text-ink">
          {renderInline(line.slice(2), `h1-${key}`)}
        </h1>,
      );
    } else if (/^https?:\/\/\S+$/.test(line)) {
      blocks.push(
        <a
          key={`a-${key++}`}
          href={line}
          target="_blank"
          rel="noreferrer"
          className="block break-all font-mono text-xs text-brand hover:underline"
        >
          {line}
        </a>,
      );
    } else {
      blocks.push(
        <p key={`p-${key++}`} className="text-sm leading-relaxed text-ink-secondary">
          {renderInline(line, `p-${key}`)}
        </p>,
      );
    }
  }
  flushList();

  return <div className="space-y-2">{blocks}</div>;
}
