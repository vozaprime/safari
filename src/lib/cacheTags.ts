/**
 * Veri katmanı önbelleğinin etiketleri ve güvenlik tavanı.
 *
 * Etiketler kaba tutuldu (içerik türü başına bir tane), satır bazlı değil:
 * içerik hacmi küçük ve ince etiketleme "unutulmuş etiket" hatasına açık.
 * Bir hizmet düzenlendiğinde bütün hizmet girdileri tazelenir; bedeli birkaç
 * sorgu, kazancı doğruluk.
 *
 * Sabit olarak tutulmalarının sebebi: `revalidateTag("servicess")` gibi bir
 * yazım hatası hiçbir hata vermez, sessizce hiçbir şeyi temizlemez.
 * `scripts/check-cache-tags.ts` düz string kullanımını yakalar.
 */
export const CACHE_TAGS = {
  settings: "settings",
  pageContent: "page-content",
  services: "services",
  references: "references",
  posts: "posts",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

/**
 * Önbellek girdilerinin azami ömrü (saniye) — bir gün.
 *
 * Normal akışta hiç devreye girmez: panelden her kayıtta ilgili etiket
 * temizlenir. Tavan yalnızca bir etiket unutulursa ya da veritabanı panel
 * dışından değişirse (script, elle düzenleme) devreye girer ve bayatlığı bir
 * günle sınırlar.
 *
 * Daha kısa bir tavan kazancın çoğunu yerdi: ~180 önbellek girdisi saatte bir
 * tazelenirse günde ~4.300 işlem eder, günde bir tazelenirse ~180.
 */
export const REVALIDATE_SECONDS = 86400;
