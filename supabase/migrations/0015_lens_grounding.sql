-- Idea Factory 0015 — grounding mercek özelliği olur (FAZ6_PLAN.md §Faz 4.1).
--
-- Eskiden hangi merceğin canlı web araması yaptığı `packages/core/grounding.ts` içinde sabit
-- bir id listesiydi (`GROUNDED_LENS_IDS = {arbitrage, white_space}`) + tek global
-- `GROUNDING_ENABLED` anahtarı. İki sorun:
--   1. 2026-08-19 pilotu grounding'in ARBİTRAJA zarar verdiğini ölçtü (12 temiz vakada
--      baseline 0.958 -> 0.875). Ama beyaz-alan analizlerinin %66'sı `confidence: low`
--      (434/662), çünkü modele arama olmadan "TR/MENA'da kaç oyuncu var" soruluyor.
--      Tek anahtar ikisini ayıramıyordu.
--   2. 2026-08-15'ten beri bütün mercekler admin merceği; pahalı olanı deploy'suz
--      kapatabilmek gerek.
--
-- Uygula: Supabase Dashboard -> SQL Editor -> Run.
-- NOT: .env'de GROUNDING_ENABLED=true aynı anda açılmalı, yoksa bu migration atıl kalır.

alter table lenses add column grounding boolean not null default false;

update lenses set grounding = true  where lens_id = 'white_space';
update lenses set grounding = false where lens_id = 'arbitrage';
