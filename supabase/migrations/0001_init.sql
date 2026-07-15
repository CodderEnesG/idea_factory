-- Idea Factory v1 — şema. Uygula: supabase db push (veya SQL editor'e yapıştır).

-- ── signals: kaynaklardan toplanan ham sinyaller ──────────────────────────
create table if not exists signals (
  id            text primary key,                    -- shortHash(url)
  source        text not null,                       -- ör. "producthunt", "tldr:founders"
  type          text not null check (type in ('launch','funding','company')),
  title         text not null,
  url           text not null unique,                -- dedup anahtarı
  summary_raw   text not null default '',
  market        text,
  sector        text,
  posted_at     timestamptz,
  fetched_at    timestamptz not null default now(),
  content_hash  text not null,                       -- naif dedup: hash(title+summary)
  created_at    timestamptz not null default now()
);
create unique index if not exists signals_content_hash_uidx on signals (content_hash);
create index if not exists signals_fetched_at_idx on signals (fetched_at desc);

-- ── analyses: analist çıktısı (sinyal × mercek) ───────────────────────────
create table if not exists analyses (
  id                 uuid primary key default gen_random_uuid(),
  signal_id          text not null references signals (id) on delete cascade,
  lens               text not null default 'arbitrage',
  fit                int  not null check (fit between 0 and 100),
  rationale          text not null,
  evidence           jsonb not null default '[]',    -- [{fact, source}]
  adaptation_notes   text not null default '',
  risks              jsonb not null default '[]',    -- string[]
  confidence         text not null check (confidence in ('low','med','high')),
  validation_needed  jsonb not null default '[]',    -- [{data, why, how_to_verify}]
  recommended_action text not null check (recommended_action in ('pursue','watch','kill')),
  tags               jsonb not null default '[]',
  model              text not null,                  -- analysis_model (ör. claude-opus-4-8)
  created_at         timestamptz not null default now(),
  unique (signal_id, lens)                           -- sinyal başına mercek başına tek analiz
);
create index if not exists analyses_fit_idx on analyses (fit desc);

-- ── decisions: insan kararı (geri-besleme tohumu) ─────────────────────────
create table if not exists decisions (
  id          uuid primary key default gen_random_uuid(),
  signal_id   text not null references signals (id) on delete cascade,
  decision    text not null check (decision in ('pursue','watch','kill')),
  note        text,
  decided_by  text,
  created_at  timestamptz not null default now()
);
create index if not exists decisions_signal_idx on decisions (signal_id);
