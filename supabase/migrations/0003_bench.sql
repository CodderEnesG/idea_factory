-- Idea Factory 0003 — bench görünümü (BENCH.md: hazır fırsat havuzu).
-- Çıta: fit >= 80 AND confidence = 'high' (arbitraj merceği).
-- Uygula: Supabase Dashboard → SQL Editor'e yapıştır → Run (veya: supabase db push)

create or replace view bench as
select
  s.id          as signal_id,
  s.title,
  s.url,
  s.source,
  s.market,
  s.sector,
  s.posted_at,
  a.fit,
  a.confidence,
  a.recommended_action,
  a.rationale,
  a.created_at  as analyzed_at,
  d.decision    as latest_decision   -- insan kararı (varsa, en yenisi)
from analyses a
join signals s on s.id = a.signal_id
left join lateral (
  select decision from decisions
  where signal_id = s.id
  order by created_at desc
  limit 1
) d on true
where a.lens = 'arbitrage'
  and a.fit >= 80
  and a.confidence = 'high';
