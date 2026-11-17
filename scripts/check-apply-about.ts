// about_body doğrulayıcısının testleri.  npx tsx scripts/check-apply-about.ts
import { aboutBodyProblems, allProblems } from "./content/validate-about";

let failures = 0;
function check(cond: boolean, note: string) {
  if (cond) console.log(`ok: ${note}`);
  else {
    console.error(`FAIL: ${note}`);
    failures++;
  }
}

const gecerli = Array.from({ length: 7 }, (_, i) => `Paragraf ${i + 1} metni burada.`).join("\n\n");
const azParagraf = "Tek paragraf.\n\nIkinci paragraf.";
const basliklı = gecerli + "\n\n## Araya giren baslik";
const gorselli = gecerli + "\n\n![alt](/u/a.jpg)";

check(aboutBodyProblems(gecerli).length === 0, "yedi duz paragraf sorunsuz");
check(aboutBodyProblems(azParagraf).length > 0, "5'ten az paragraf sorun bildirir");
check(aboutBodyProblems(basliklı).length > 0, "baslik blogu sorun bildirir");
check(aboutBodyProblems(gorselli).length > 0, "gorsel blogu sorun bildirir");
check(aboutBodyProblems("").length > 0, "bos govde sorun bildirir");

// Asıl hata buydu: tr gecerli, en bozuk. Yazmadan ONCE butun diller
// denetlenmeli; aksi halde tr'ye yazilip en'de durulur ve "hicbir sey
// yazilmadi" denir.
const karisik = { tr: gecerli, en: azParagraf, ru: gecerli };
const sonuc = allProblems(karisik);
check(sonuc.length > 0, "bir dil bozuksa toplu denetim sorun bildirir");
check(
  sonuc.every((p) => p.locale === "en"),
  "sorun yalnizca bozuk dile atfedilir"
);
check(allProblems({ tr: gecerli, en: gecerli, ru: gecerli }).length === 0, "uc dil de gecerliyse sorun yok");

console.log(failures ? `\n${failures} HATA` : "\nhata yok");
process.exit(failures ? 1 : 0);
