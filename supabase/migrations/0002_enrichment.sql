-- Idea Factory 0002 — sinyal zenginleştirme (enrichment).
-- Uygula: Supabase Dashboard → SQL Editor'e yapıştır → Run
-- (veya: supabase db push)

alter table signals add column if not exists enrichment jsonb;          -- extraction + {fetch_ok, model, page_chars}
alter table signals add column if not exists enriched_at timestamptz;   -- null = henüz zenginleştirilmedi

create index if not exists signals_enriched_at_idx on signals (enriched_at);
