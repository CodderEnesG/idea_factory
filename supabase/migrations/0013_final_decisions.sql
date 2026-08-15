-- Idea Factory 0013 — Kesinleşmiş karar (final_decisions) + izle-tekrar-inceleme takvimi.
-- Kişisel `decisions` log'u paralel/kişi-başı kalmaya devam ediyor (kimse ezilmiyor, bkz.
-- load-decisions.ts) — bu yeni tablo ONA EK, sinyal başına TEK satırlık "resmi/ekip" karar.
-- Herhangi bir üye kilitleyebilir/açabilir (kullanıcı kararı 2026-08-15) — admin kısıtı YOK,
-- 0006_admin.sql'deki requireAdmin() deseninden bilinçli farklı. Uygula: Supabase Dashboard →
-- SQL Editor → Run.

create table final_decisions (
  signal_id   text primary key references signals(id) on delete cascade,
  decision    text not null check (decision in ('pursue','watch','kill')),
  reason      text,
  decided_by  text not null,
  decided_at  timestamptz not null default now()
);

-- İzle kararı kesinleşince +30 gün sonrası set edilir (final/route.ts); Panom "Bugün gözden
-- geçir" bunu okur. pursue/kill'e geçince ya da kilit açılınca null'a döner — pasif bir
-- "izle" yığını yerine periyodik olarak geri yüzeye çıkan bir döngü olsun diye.
alter table signals add column watch_review_at timestamptz;

alter table final_decisions enable row level security;
-- policy YOK (0005 deseni): anon/authenticated kapalı; yalnız service-role erişir.
