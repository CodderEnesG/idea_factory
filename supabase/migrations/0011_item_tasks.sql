-- Idea Factory 0011 — Panom (Faz 5.1): kovala/izle/ele artık yalnız etiket değil, sinyal
-- başına hafif görev/checklist taşıyor. Desen 0005_members_comments.sql ile birebir aynı
-- (RLS açık + policy yok = yalnız service-role erişir). Uygula: Supabase Dashboard →
-- SQL Editor → Run.

create table item_tasks (
  id           uuid primary key default gen_random_uuid(),
  signal_id    text not null references signals(id) on delete cascade,
  owner        text not null,          -- decisions.decided_by ile aynı: username
  body         text not null,
  done         boolean not null default false,
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);
create index item_tasks_signal_owner_idx on item_tasks (signal_id, owner);

alter table item_tasks enable row level security;
-- policy YOK (0004/0005 deseni): anon/authenticated kapalı; yalnız service-role erişir.
