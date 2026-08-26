-- Idea Factory 0014 — Yorumcu kapısı (FAZ6_PLAN.md §Faz 1.2 + §Faz 2).
--
-- AI Yorumcusu artık kararın ARKASINDA değil ÖNÜNDE: her AI-kovala adayı (kompozit band =
-- pursue) insan görmeden önce İKİ bağımsız tartışmadan geçer, herhangi biri "ele" derse
-- kart kovala rozetini alamaz. Ölçüm (2026-08-25, 79 AI-kovala + 155 insan kararı):
--   fit>=80                          -> insan-kovala kesinliği %22
--   fit>=80 AND yorumcu "ele" demedi -> %53
-- Çift tur, tartışmanın kendi test-retest tutarlılığı %67 olduğu için (27 mükerrer
-- tartışmanın 9'u farklı sonuç verdi) — tek koşu şansa açık.
--
-- Uygula: Supabase Dashboard -> SQL Editor -> Run.
--
-- ÖN KONTROL (0 dönmeli, yoksa aşağıdaki generated column ALTER'ı patlar):
--   select count(*) from debates where jsonb_typeof(transcript) <> 'array';

alter table debates add column kind text not null default 'manual'
  check (kind in ('auto', 'manual'));
alter table debates add column run_no smallint;
-- DebateRoom.tsx collapsed etiketi "N tur" yazıyor; transkript artık lazy yüklendiği için
-- (yalnız kart açılınca /api/debates/[signalId]) bu sayı satırın kendisinden gelmeli.
alter table debates add column turn_count int
  generated always as (jsonb_array_length(transcript)) stored;

-- Mevcut otomatik satırları işaretle (debate-auto.ts AUTO_CREATED_BY = 'otomatik (kovala kararı)').
update debates set kind = 'auto' where created_by like 'otomatik%';

-- Mevcut auto satırlara sıra numarası ver (sinyal başına en eski = 1). 28 mükerrer satır var;
-- bunlar SİLİNMEZ — 2 ve 3 numaralı turlar olarak kapının çift-tur verisine katılırlar.
with n as (
  select id, row_number() over (partition by signal_id order by created_at) as rn
    from debates where kind = 'auto'
)
update debates d set run_no = n.rn from n where n.id = d.id;

-- DİKKAT: `unique (signal_id)` YANLIŞ olurdu — sinyal başına iki tartışma artık BİLİNÇLİ.
-- Bu kısıt yalnız AYNI turun mükerrerini engeller (eşzamanlı iki tick aynı run_no'yu yazamaz);
-- çift turu engellemez ve admin'in elle yeniden tartıştırmasını (kind='manual') hiç etkilemez.
create unique index debates_auto_run on debates (signal_id, run_no) where kind = 'auto';

-- Kapı sorgusu sinyal başına auto tur SAYISINI okuyor — bu indeks onu ucuzlatır.
create index debates_kind_signal_idx on debates (kind, signal_id);
