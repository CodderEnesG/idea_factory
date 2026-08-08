-- Idea Factory 0006 — admin rolü (Faz 3-A). Editable tez/mercek (B/C) ve AI Yorumcusu (E) buna dayanır.
-- Uygula: Supabase Dashboard → SQL Editor → Run.

alter table members add column is_admin boolean not null default false;
