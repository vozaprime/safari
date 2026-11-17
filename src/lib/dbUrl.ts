/**
 * Bağlantı dizesine havuz sınırı ekler.
 *
 * Prisma Postgres'te **doğrudan** bağlantı limiti plana göre 10/10/50/100'dür
 * ve bunun 5'i platform işlemlerine ayrılmıştır — Free/Starter'da uygulamaya
 * fiilen ~5 bağlantı kalır. Prisma ORM 6'nın varsayılan havuzu ise instance
 * başına `CPU×2+1` (≈5-9) açar. Sitedeki 13 sayfa `force-dynamic` olduğu için
 * her istek veritabanına gider; tek bir serverless instance bütçenin tamamını
 * tüketebilir. 17 Kasım 2026'da bütün sayfalar bu yüzden
 * `too many connections` ile 500 döndü.
 *
 * Kalıcı çözüm havuzlu (`prisma+postgres://`) bağlantıya geçmektir; havuzlu
 * limitler 10/100/500/1000'dir. Bu modül o geçiş yapılana kadar emniyet
 * kemeridir ve **havuzlu dizeye dokunmaz**, dolayısıyla geçişte kaldırılması
 * gerekmez: dize değişince kendiliğinden devre dışı kalır.
 *
 * Yerel geliştirme de aynı veritabanını paylaştığı için sınır orada da işe
 * yarar — açık kalan bir `next dev` bütçenin yarısını tutabiliyordu.
 *
 * Prisma ORM 7'de bu parametrelerin yerini driver adapter'ın `max` ayarı alır;
 * o yükseltmede burası elden geçirilmeli.
 */

/** Yalnızca doğrudan Postgres dizeleri sınırlanır. */
const DOGRUDAN_SEMALAR = ["postgres://", "postgresql://"] as const;

const VARSAYILAN_CONNECTION_LIMIT = "1";
const VARSAYILAN_POOL_TIMEOUT = "20";

/** Pozitif tam sayı değilse `undefined` — sıfır da geçersizdir, Prisma kabul etmez. */
function pozitifTamSayi(value: string | undefined): string | undefined {
  const t = (value ?? "").trim();
  return /^[1-9][0-9]*$/.test(t) ? t : undefined;
}

function parametreVar(url: string, ad: string): boolean {
  return new RegExp(`[?&]${ad}=`).test(url);
}

/**
 * Dizeyi metin olarak işler, `new URL(...)` ile yeniden serileştirmez: parametre
 * sırası ve kaçışlar olduğu gibi kalsın, dizede ne varsa aynen korunsun.
 *
 * Dizede `connection_limit` zaten varsa hiçbir şey yapılmaz — açık ayar her
 * zaman kazanır. Ayrıştırılamayan veya boş girdi olduğu gibi döner; hatayı
 * Prisma kendi mesajıyla versin.
 *
 * Hiçbir kod yolu dizeyi loglamaz veya hata mesajına koymaz: içinde parola var.
 */
export function applyPoolLimits(
  url: string | undefined,
  env: Record<string, string | undefined>
): string | undefined {
  if (!url) return url;
  if (!DOGRUDAN_SEMALAR.some((s) => url.startsWith(s))) return url;
  if (parametreVar(url, "connection_limit")) return url;

  const limit = pozitifTamSayi(env.DATABASE_CONNECTION_LIMIT) ?? VARSAYILAN_CONNECTION_LIMIT;
  const timeout = pozitifTamSayi(env.DATABASE_POOL_TIMEOUT) ?? VARSAYILAN_POOL_TIMEOUT;

  const eklenecek = [`connection_limit=${limit}`];
  if (!parametreVar(url, "pool_timeout")) eklenecek.push(`pool_timeout=${timeout}`);

  return url + (url.includes("?") ? "&" : "?") + eklenecek.join("&");
}
