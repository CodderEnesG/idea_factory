-- Idea Factory 0007 — tez editable (Faz 3-B). Kaydetmek yeni versiyon açar (append-only,
-- eski versiyonlar denetim/rollback için durur); worker her koşuda aktif versiyonu çeker.
-- Uygula: Supabase Dashboard → SQL Editor → Run.

create table thesis_versions (
  id         uuid primary key default gen_random_uuid(),
  version    text not null,
  config     jsonb not null,
  is_active  boolean not null default false,
  created_by text not null,
  created_at timestamptz not null default now()
);
create index thesis_versions_active_idx on thesis_versions (is_active, created_at desc);

alter table thesis_versions enable row level security;
-- policy YOK: RLS açık + policy yok = anon/authenticated kapalı; yalnız service-role erişir (0005 deseni).
