-- Idea Factory 0009 — AI Yorumcusu, çok-ajanlı tartışma odası (Faz 3-E). Admin bir kartta
-- tetikler (otomatik/toplu DEĞİL). `analyses`'a DEĞİL, ayrı bu tabloya yazılır — nitel
-- tartışma, ağırlıklı-ortalama kompozit skora karışmaz. Uygula: Supabase Dashboard → SQL Editor.

create table debates (
  id               uuid primary key default gen_random_uuid(),
  signal_id        text not null references signals(id) on delete cascade,
  created_by       text not null,
  transcript       jsonb not null,
  final_verdict    text not null,   -- pursue|watch|kill
  final_commentary text not null,
  created_at       timestamptz not null default now()
);
create index debates_signal_idx on debates (signal_id, created_at desc);

alter table debates enable row level security;
-- policy YOK: RLS açık + policy yok = anon/authenticated kapalı; yalnız service-role erişir (0005 deseni).
