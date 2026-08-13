-- Idea Factory 0012 — Toplama Ayarları (Faz 5.4): `ingest.ts`'in şu ana kadar hiç
-- ayarlanamayan iki gerçek "hız" kolu — kaynak başına çekilecek üst sınır ve kaynakların
-- paralel mi sıralı mı çekileceği — artık admin panelinden değiştirilebilir. Sıklık (cron
-- zamanlaması) BİLİNÇLİ OLARAK bu tabloda YOK: `apps/worker/src/cron.ts`'in `CRON_SCH
,EDULE`ta
-- env'i ve `.github/workflows/cron-tick.yml`'in statik YAML cron'u — ikisi de burada
-- okunmuyor, DB'den değiştirilemez; sahte bir kontrol eklemek yerine admin sayfasında salt
-- okunur açıklanıyor. Desen `0007_thesis_versions.sql` ile birebir aynı (versiyonlu,
-- append-only, tek aktif satır — rollback için eskiler durur).

create table ingestion_settings (
  id          uuid primary key default gen_random_uuid(),
  version     text not null,
  config      jsonb not null,   -- { per_source_limit: number, concurrency: number }
  is_active   boolean not null default false,
  created_by  text,
  created_at  timestamptz not null default now()
);
create index ingestion_settings_active_idx on ingestion_settings (is_active, created_at desc);

alter table ingestion_settings enable row level security;
-- policy YOK (0004/0005 deseni): yalnız service-role erişir.
