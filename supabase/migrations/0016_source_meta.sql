-- Idea Factory 0016 — kaynağa özgü yapılandırılmış metrik (Kanıtlı gelir listesi).
--
-- Mobil/consumer fikirlerde "orada çalışıyor" kanıtı fon haberi değil gelir ve sıralama
-- (2026-09-26 ölçümü: mobil sinyallerin neredeyse hepsi dev şirket haberi ya da HN yan projesi).
-- Gelir kanıtlı kaynaklar (elle girilen doğrulanmış gelir, App Store hasılat sırası) rakamı hem
-- summary_raw'a metin olarak (analist görsün) hem buraya yapılandırılmış olarak (UI sıralasın) yazar.
-- Diğer kaynaklarda null kalır.
--
-- Uygula: Supabase Dashboard -> SQL Editor -> Run.

alter table signals add column if not exists source_meta jsonb;
