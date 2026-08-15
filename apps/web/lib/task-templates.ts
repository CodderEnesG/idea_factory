/**
 * "Kovala" kararı verilince boş bir checklist yerine düzenlenebilir bir başlangıç noktası
 * (PLAN.md §11 madde-sonrası problem 3: "adım atma yönü güçsüz"). Mercek başına şablon YOK
 * — mercekler artık tamamen admin-dinamik (lenses.config.ts, 2026-08-15), sabit bir lens id
 * setine bağlamak kırılgan olurdu. Genel, her fırsata uyan 3 adım; kullanıcı düzenler/siler.
 */
export const PURSUE_STARTER_TASKS: readonly string[] = [
  "Kurucuya/ekibe ulaş",
  "Rakip ve pazar taraması yap",
  "Fiyatlandırma & TAM notu çıkar",
];
