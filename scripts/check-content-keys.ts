// Onbellek anahtari yardimcilarinin testleri.  npx tsx scripts/check-content-keys.ts
//
// Bu testler veritabanina DOKUNMAZ: contentKeys.ts saf tutuldugu icin
// baglanti kapaliyken de calisir.
import {
  clampPage,
  slugIsKnown,
  slugIsKnownInAnyLocale,
  slugIsKnownForRedirect,
  stripSecretSettings,
} from "../src/lib/contentKeys";
import type { Locale } from "../src/lib/i18n";

let failures = 0;

function expect<T>(got: T, want: T, note: string) {
  if (got === want) {
    console.log(`ok: ${note}`);
  } else {
    console.error(`FAIL: ${note}\n     beklenen: ${JSON.stringify(want)}\n     gelen   : ${JSON.stringify(got)}`);
    failures++;
  }
}

// --- clampPage ---
// Sayfa numarasi ziyaretci girdisinden geliyor; onbellek anahtari olmadan
// once gercek bir sayfaya kirpilmali, yoksa ?page=999999 ayri bir anahtar
// (ve ayri bir sorgu) uretir.
expect(clampPage(1, 13, 9), 1, "gecerli ilk sayfa korunur");
expect(clampPage(2, 13, 9), 2, "gecerli son sayfa korunur");
expect(clampPage(0, 13, 9), 1, "sifir 1'e cekilir");
expect(clampPage(-3, 13, 9), 1, "negatif 1'e cekilir");
expect(clampPage(2.7, 13, 9), 2, "ondalik asagi yuvarlanir");
expect(clampPage(999999, 13, 9), 2, "aralik disi son sayfaya kirpilir");
expect(clampPage(NaN, 13, 9), 1, "NaN 1'e cekilir");
expect(clampPage(1, 0, 9), 1, "hic yazi yoksa 1 doner (sifira bolme yok)");

// --- slug kumeleri ---
// `entries`, getAllLocalizedSlugs()'un dondurdugu dizilerin eleman tipidir:
// her eleman bir icerigin dillere gore slug haritasi.
const entries: Partial<Record<Locale, string>>[] = [
  { tr: "sirket-kurulusu", en: "company-formation" },
  { tr: "ticaret" },
];

expect(slugIsKnown(entries, "tr", "sirket-kurulusu"), true, "dogru dildeki slug taninir");
expect(slugIsKnown(entries, "en", "sirket-kurulusu"), false, "baska dilin slug'i o dilde taninmaz");
expect(slugIsKnown(entries, "ru", "sirket-kurulusu"), false, "cevirisi olmayan dil icin false");
expect(slugIsKnown(entries, "tr", "yok-boyle-bir-sey"), false, "bilinmeyen slug false");
expect(slugIsKnown([], "tr", "sirket-kurulusu"), false, "bos harita false");

// Dil degistirici `resolveServiceSlug`'i BASKA bir dilin slug'iyla cagirir;
// yalnizca hedef dile bakan bir kontrol dil degistirmeyi sessizce kirar.
expect(slugIsKnownInAnyLocale(entries, "company-formation"), true, "dil degistirici: baska dilin slug'i taninir");
expect(slugIsKnownInAnyLocale(entries, "yok-boyle-bir-sey"), false, "bilinmeyen slug her dilde false");

// --- yeniden adlandirma sonrasi yonlendirme ---
// Panelden bir cevirinin slug'i degistiginde Service.slug (ortak slug) ESKI
// haliyle kaliyor ve eski URL ondan yonlendiriliyor. Ortak slug, cevirisi
// kendi slug'ina sahip diller icin alternatif haritasinda GORUNMEZ; bu yuzden
// yonlendirme kontrolu ortak slug'lari ayrica kabul etmeli, yoksa yeniden
// adlandirmadan sonra eski adres 301 yerine 404 doner.
const ortak = ["sirket-kurulusu", "ticaret"];
expect(
  slugIsKnownForRedirect(entries, ortak, "company-formation"),
  true,
  "baska dilin slug'i yonlendirme icin taninir"
);
expect(
  slugIsKnownForRedirect([{ tr: "yeni-ad" }], ortak, "sirket-kurulusu"),
  true,
  "yeniden adlandirma sonrasi ESKI ortak slug yonlendirme icin taninir"
);
expect(
  slugIsKnownForRedirect([{ tr: "yeni-ad" }], ortak, "hic-olmayan"),
  false,
  "bilinmeyen slug yonlendirme icin de taninmaz"
);
expect(slugIsKnownForRedirect([], [], "sirket-kurulusu"), false, "bos kumeler false");

// --- sir niteligindeki ayarlar ---
// Onbellekli getSettings her public render'da cagriliyor; smtp_* anahtarlari
// (sifreli smtp_pass dahil) Vercel Data Cache'ine girmemeli.
const ayarlar = {
  site_title: "Safari",
  contact_email: "a@b.c",
  smtp_host: "smtp.example.com",
  smtp_user: "kullanici",
  smtp_pass: "sifreli-deger",
  smtp_from: "no-reply@example.com",
  smtp_port: "587",
};
const temiz = stripSecretSettings(ayarlar);
expect(Object.keys(temiz).sort().join(","), "contact_email,site_title", "smtp_* anahtarlari ayiklanir");
expect("smtp_pass" in temiz, false, "sifreli smtp_pass onbellekli surumde yok");
expect(temiz.site_title, "Safari", "sir olmayan anahtarlar korunur");
expect(Object.keys(stripSecretSettings({})).length, 0, "bos harita bos doner");

console.log(failures ? `\n${failures} HATA` : "\nhata yok");
process.exit(failures ? 1 : 0);
