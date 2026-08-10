-- Idea Factory 0010 — digest dağıtımı (Faz 4 madde 7). `pnpm digest`/cron her koşuda
-- markdown'ı hem lokale (digests/*.md, gitignored) hem buraya yazar — dağıtım kanalı artık
-- GitHub Actions artifact'i (30 gün, indirmek gerekir) değil, canlı `/digest` sayfası.
-- Uygula: Supabase Dashboard → SQL Editor → Run.

create table digests (
  id          uuid primary key default gen_random_uuid(),
  markdown    text not null,
  item_count  int not null default 0,
  bench_count int not null default 0,
  created_at  timestamptz not null default now()
);
create index digests_created_at_idx on digests (created_at desc);

alter table digests enable row level security;
-- policy YOK: RLS açık + policy yok = anon/authenticated kapalı; yalnız service-role erişir (0005 deseni).
