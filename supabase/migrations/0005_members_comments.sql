-- Idea Factory 0005 — ekip incelemesi: hafif login (members) + sinyal başına yorum thread'i.
-- Per-user kararlar için decisions şeması DEĞİŞMEZ (decided_by artık gerçek username tutar,
-- append-only kalır = feedback geçmişi). Uygula: Supabase Dashboard → SQL Editor → Run.

-- members: hafif login. Service-role okur; RLS açık + policy yok (anon kapalı, 0004 deseni).
create table members (
  id            uuid primary key default gen_random_uuid(),
  username      text unique not null,
  password_hash text not null,          -- node:crypto scrypt: "salt:hash" (hex)
  display_name  text not null,
  created_at    timestamptz not null default now()
);

-- comments: sinyal başına thread. append-only.
create table comments (
  id         uuid primary key default gen_random_uuid(),
  signal_id  text not null references signals(id) on delete cascade,
  author     text not null,             -- members.username
  body       text not null,
  created_at timestamptz not null default now()
);
create index comments_signal_idx on comments (signal_id, created_at);

-- kararı (sinyal, kullanıcı) başına en-yeni okumak için indeks.
create index decisions_signal_user_idx on decisions (signal_id, decided_by, created_at desc);

alter table members  enable row level security;
alter table comments enable row level security;
-- policy YOK: RLS açık + policy yok = anon/authenticated kapalı; yalnız service-role erişir.
