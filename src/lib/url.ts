/**
 * Panelden girilen bir bağlantı ayarını gerçekten gidilebilir bir URL'ye çevirir;
 * çeviremezse null döner.
 *
 * Neden gerekli: ayarın yalnızca dolu olup olmadığına bakmak yetmiyor. Kurulumdan
 * kalan `#` yer tutucuları "dolu" sayıldığı için iletişim sayfasında ve footer'da
 * altı sosyal medya ikonu da ölü bağlantı olarak render ediliyordu.
 *
 * Kurallar:
 *   - Boş, yalnızca boşluk veya `#` ise reddedilir.
 *   - Şema yazılmamışsa `https://` varsayılır (panele `linkedin.com/...` yazmak yeter).
 *   - Yalnızca http/https kabul edilir; `javascript:` gibi şemalar elenir.
 *   - Alan adı noktalı olmalıdır, bu da `#`, `-`, `tbd` gibi yer tutucuları eler.
 */
export function toSocialHref(raw: string | undefined | null): string | null {
  const value = (raw || "").trim();
  if (!value || value === "#") return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}
