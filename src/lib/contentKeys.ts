/**
 * Önbellek anahtarlarını sınırlayan saf yardımcılar.
 *
 * Ziyaretçi girdisi (slug, `?page=`) doğrudan bir önbellek anahtarına girerse
 * anahtar uzayı sınırsızdır: rastgele URL tarayan bir bot her denemesinde yeni
 * bir anahtar ve yeni bir sorgu üretir. Önbelleklemenin kurtardığı Prisma işlem
 * kotası o yoldan yeniden tükenir. Bu yüzden doğrulama ve kırpma önbelleğin
 * **dışında**, bu fonksiyonlarla yapılır.
 *
 * Dosya bilerek saf: `prisma` ve `next/cache` import etmez, böylece testleri
 * veritabanı kapalıyken de çalışır.
 */
import type { Locale } from "./i18n";

/**
 * Sayfa numarasını 1 ile gerçek son sayfa arasına kırpar.
 *
 * `NaN`, sıfır, negatif ve ondalık değerler 1'e ya da en yakın geçerli sayfaya
 * düşer; aralık dışı büyük değerler son sayfaya kırpılır. İçerik yoksa sonuç
 * 1'dir — sıfıra bölme yok.
 */
export function clampPage(page: number, totalItems: number, perPage: number): number {
  const lastPage = Math.max(1, Math.ceil(totalItems / perPage));
  if (!Number.isFinite(page)) return 1;
  return Math.min(lastPage, Math.max(1, Math.floor(page)));
}

/**
 * Slug, **o dilde** yayında olan bir içeriğe ait mi?
 *
 * `getAllLocalizedSlugs()` başlığı boş olan çevirileri haritaya koymaz, bu
 * yüzden o dilde çevrilmemiş içerik burada da bilinmez sayılır.
 */
export function slugIsKnown(
  entries: Partial<Record<Locale, string>>[],
  locale: Locale,
  slug: string
): boolean {
  return entries.some((entry) => entry[locale] === slug);
}

/**
 * Slug **herhangi bir dilde** yayında olan bir içeriğe ait mi?
 *
 * Dil değiştirici (`resolveServiceSlug` / `resolvePostSlug`) hedef dilin değil,
 * ziyaretçinin bulunduğu dilin slug'ıyla çağrılır. Yalnızca hedef dile bakan bir
 * kontrol dil değiştirmeyi sessizce kırar.
 */
export function slugIsKnownInAnyLocale(
  entries: Partial<Record<Locale, string>>[],
  slug: string
): boolean {
  return entries.some((entry) => Object.values(entry).includes(slug));
}
