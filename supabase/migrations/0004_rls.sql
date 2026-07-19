-- Idea Factory 0004 — RLS sertleştirmesi (faz 8 güvenlik incelemesi).
-- Worker ve web yalnız service-role ile bağlanır (RLS'i zaten deler); anon/authenticated
-- rollerinin PostgREST üzerinden tablolara doğrudan erişimi bu migration ile kapanır.
-- Policy bilinçli olarak YOK: RLS açık + policy yok = anon için her şey kapalı.
-- Uygula: Supabase Dashboard → SQL Editor'e yapıştır → Run

alter table signals   enable row level security;
alter table analyses  enable row level security;
alter table decisions enable row level security;

-- View'lar varsayılan olarak sahibinin (postgres) yetkisiyle koşar ve RLS'i deler —
-- bench'i sorgulayanın yetkisine bağla ki anon view üzerinden de içeri giremesin.
alter view bench set (security_invoker = true);
