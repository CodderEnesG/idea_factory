import { redirect } from "next/navigation";

// Ayarlar tek sekmeli sayfaya taşındı (backlog #9) — eski link/yer imleri için yönlendirme.
export default function AdminMerceklerRedirect() {
  redirect("/admin?tab=mercekler");
}
