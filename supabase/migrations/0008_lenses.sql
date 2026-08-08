-- Idea Factory 0008 — mercek editable, iskeletli soru editörü (Faz 3-C). Builtin mercekler
-- (arbitraj/beyaz-alan) burada YOK — kod-tanımlı kalır, silinemez/düzenlenemez. Admin yalnız
-- EKLER: ad + ağırlık + extra_note etiketi + domain soru listesi (guard kuralları koddan gelir).
-- Uygula: Supabase Dashboard → SQL Editor → Run.

create table lenses (
  lens_id           text primary key,       -- runtime slug (Lens.id / analyses.lens)
  name              text not null,
  weight            numeric not null default 1,
  extra_note_label  text not null,
  questions         text[] not null,
  active            boolean not null default true,
  created_by        text not null,
  created_at        timestamptz not null default now()
);

alter table lenses enable row level security;
-- policy YOK: RLS açık + policy yok = anon/authenticated kapalı; yalnız service-role erişir (0005 deseni).
