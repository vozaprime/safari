// Onbellek yapisinin testleri.  npx tsx scripts/check-cache-tags.ts
//
// Bu testler YAPIYI dogrular, davranisi degil: kaynak dosyalari metin olarak
// okur, veritabanina dokunmaz. Amaci, sonradan eklenen bir okumanin
// sarmalanmadan ya da yeni bir icerik action'inin etiket temizlemeden
// gecmesini engellemek -- ikisi de sessiz hatalar.
import fs from "fs";
import { CACHE_TAGS, REVALIDATE_SECONDS } from "../src/lib/cacheTags";

let failures = 0;

function expect<T>(got: T, want: T, note: string) {
  if (got === want) {
    console.log(`ok: ${note}`);
  } else {
    console.error(`FAIL: ${note}\n     beklenen: ${JSON.stringify(want)}\n     gelen   : ${JSON.stringify(got)}`);
    failures++;
  }
}

function fail(note: string, detail: string) {
  console.error(`FAIL: ${note}\n     ${detail}`);
  failures++;
}

function ok(note: string) {
  console.log(`ok: ${note}`);
}

const content = fs.readFileSync("src/lib/content.ts", "utf8");

// ---------------------------------------------------------------- A bolumu
// content.ts'te prisma'ya inen her disa aktarilan okuma sarmalanmis olmali.

const SARMALANACAK = [
  "getPageContent",
  "getServices",
  "getService",
  "resolveServiceSlug",
  "getReferences",
  "getPosts",
  "getPost",
  "resolvePostSlug",
  "countPublishedPosts",
  "getPublishedPostsPage",
  "getAllLocalizedSlugs",
  "getSettings",
];

/** Disa aktarilan `ad` fonksiyonunun govdesini dondurur (bir sonraki ust duzey tanima kadar). */
function exportedBody(src: string, ad: string): string | null {
  const re = new RegExp(`export (?:async function|const) ${ad}\\b`);
  const m = re.exec(src);
  if (!m) return null;
  const rest = src.slice(m.index);
  const next = /\n(?:export |const cached|async function raw)/.exec(rest.slice(1));
  return next ? rest.slice(0, next.index + 1) : rest;
}

function buyukHarf(ad: string) {
  return ad[0].toUpperCase() + ad.slice(1);
}

for (const ad of SARMALANACAK) {
  const govde = exportedBody(content, ad);
  if (!govde) {
    fail(`${ad} sarmalanmis`, "disa aktarilan tanim bulunamadi");
    continue;
  }
  // Iki kabul edilen bicim:
  //  A) export const <ad> = unstable_cache(...)
  //  B) const cached<Ad> = unstable_cache(...)  +  export async function <ad>() { ... cached<Ad>(...) }
  const bicimA = new RegExp(`export const ${ad} = unstable_cache\\(`).test(content);
  const icAd = `cached${buyukHarf(ad)}`;
  const bicimB =
    new RegExp(`const ${icAd} = unstable_cache\\(`).test(content) && govde.includes(`${icAd}(`);
  if (bicimA || bicimB) ok(`${ad} sarmalanmis`);
  else fail(`${ad} sarmalanmis`, `ne 'export const ${ad} = unstable_cache(' ne de '${icAd}' bulundu`);
}

// TURETILMIS kontrol -- asil koruma bu. Yukaridaki liste elle yazildigi icin
// SONRADAN eklenen bir okumayi yakalamaz. Burada kurali kaynaktan cikariyoruz:
// prisma'ya inen her ust duzey blok ya `raw*` adini tasir ya da bilincli
// istisna `getSettingsUncached`'tir, ve her `raw*` bir unstable_cache
// cagrisinda referans edilir.
const blokDeseni = /^(?:export )?(?:async function|const) (\w+)/gm;
const baslangiclar: { ad: string; indeks: number }[] = [];
for (let m = blokDeseni.exec(content); m; m = blokDeseni.exec(content)) {
  baslangiclar.push({ ad: m[1], indeks: m.index });
}
const bloklar = baslangiclar.map((b, i) => ({
  ad: b.ad,
  govde: content.slice(b.indeks, i + 1 < baslangiclar.length ? baslangiclar[i + 1].indeks : content.length),
}));

const SIR_ISTISNASI = "getSettingsUncached";
const sarmalanmamisOkumalar = bloklar
  .filter((b) => b.govde.includes("prisma."))
  .filter((b) => !b.ad.startsWith("raw") && b.ad !== SIR_ISTISNASI)
  .map((b) => b.ad);
expect(sarmalanmamisOkumalar.join(","), "", "prisma'ya inen her blok raw* (ya da getSettingsUncached)");

const referanssizRaw = bloklar
  .filter((b) => b.ad.startsWith("raw"))
  .filter((b) => !content.includes(`unstable_cache(${b.ad},`))
  .map((b) => b.ad);
expect(referanssizRaw.join(","), "", "her raw* bir unstable_cache cagrisinda kullanilmis");

// Sayim: her okuma icin tam bir unstable_cache cagrisi olmali.
const sarmalayiciSayisi = (content.match(/unstable_cache\(/g) || []).length;
expect(sarmalayiciSayisi, SARMALANACAK.length, `unstable_cache cagrisi sayisi ${SARMALANACAK.length}`);

// Etiket olarak yalnizca CACHE_TAGS sabitleri kullanilmali: duz string yazim
// hatasi revalidateTag'i sessizce etkisiz birakir.
const etiketBloklari = content.match(/tags:\s*\[[^\]]*\]/g) || [];
if (etiketBloklari.length === 0) {
  fail("etiketler CACHE_TAGS'ten geliyor", "hic 'tags: [...]' blogu yok");
} else {
  const kirli = etiketBloklari.filter((b) =>
    b
      .slice(b.indexOf("[") + 1, b.lastIndexOf("]"))
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .some((x) => !x.startsWith("CACHE_TAGS."))
  );
  if (kirli.length) fail("etiketler CACHE_TAGS'ten geliyor", `duz string iceren blok: ${kirli[0]}`);
  else ok(`etiketler CACHE_TAGS'ten geliyor (${etiketBloklari.length} blok)`);
}

// Guvenlik tavani: her sarmalayici ayni sabiti kullanmali.
expect(REVALIDATE_SECONDS, 86400, "REVALIDATE_SECONDS = 86400 (bir gun)");
const revalidateSayisi = (content.match(/revalidate:\s*REVALIDATE_SECONDS/g) || []).length;
expect(revalidateSayisi, SARMALANACAK.length, "her sarmalayici REVALIDATE_SECONDS kullaniyor");
const kacakRevalidate = content.match(/revalidate:\s*(?!REVALIDATE_SECONDS)\S+/g) || [];
expect(kacakRevalidate.length, 0, "REVALIDATE_SECONDS disinda revalidate degeri yok");

// Etiket kumesi tasarimdakiyle ayni olmali.
expect(Object.values(CACHE_TAGS).sort().join(","), "page-content,posts,references,services,settings", "bes etiket, tasarimdaki adlarla");

// ---------------------------------------------------------------- B bolumu
// SMTP ayarlari onbellege girmemeli.
//
// getSettings() butun setting satirlarini donduruyor: smtp_host, smtp_user,
// smtp_from ve sifreli smtp_pass dahil. E-posta gonderimi dusuk hacimli
// oldugu icin mail.ts bunlari her seferinde taze okur -- hem sirlar Vercel
// Data Cache'ine girmez, hem panel disindan degisen bir SMTP ayari bir
// sonraki gonderimde gecerli olur.

/** `src/` altinda verilen tanimlayiciyi import eden dosyalar. */
function tuketenler(ad: string): string[] {
  const out: string[] = [];
  const gez = (dir: string) => {
    for (const girdi of fs.readdirSync(dir, { withFileTypes: true })) {
      const yol = `${dir}/${girdi.name}`;
      if (girdi.isDirectory()) gez(yol);
      else if (/\.tsx?$/.test(girdi.name)) {
        const metin = fs.readFileSync(yol, "utf8");
        if (new RegExp(`\\b${ad}\\s*\\(`).test(metin)) out.push(yol);
      }
    }
  };
  gez("src");
  return out.filter((f) => f !== "src/lib/content.ts").sort();
}

expect(
  tuketenler("getSettingsUncached").join(","),
  "src/lib/mail.ts",
  "getSettingsUncached'in tek tuketicisi mail.ts"
);

const mail = fs.readFileSync("src/lib/mail.ts", "utf8");
expect(/\bgetSettings\b/.test(mail), false, "mail.ts onbellekli getSettings'i kullanmaz");
expect(/\bgetSettingsUncached\b/.test(mail), true, "mail.ts onbelleksiz surumu kullanir");
expect(/export async function getSettingsUncached\b/.test(content), true, "getSettingsUncached content.ts'ten disa aktariliyor");

// ---------------------------------------------------------------- C bolumu
// Icerige dokunan her panel action'i ilgili etiketi temizlemeli.
//
// Etiket temizlenmezse icerik guvenlik tavanina (bir gun) kadar bayat kalir.
// Yeni bir mutasyon action'i eklenip siniflandirilmazsa test kirilir.

const actions = fs.readFileSync("src/app/admin/actions.ts", "utf8");
const actionGovdeleri = new Map<string, string>();
for (const parca of actions.split("export async function ").slice(1)) {
  actionGovdeleri.set(parca.slice(0, parca.indexOf("(")), parca);
}

/** Etiket degerinden sabit ifadesine: "services" -> "CACHE_TAGS.services" */
const sabitIfadesi = new Map(
  Object.entries(CACHE_TAGS).map(([anahtar, deger]) => [deger as string, "CACHE_TAGS." + anahtar])
);

const ICERIK_ACTIONS: Record<string, string> = {
  updateServiceAction: CACHE_TAGS.services,
  createServiceAction: CACHE_TAGS.services,
  deleteServiceAction: CACHE_TAGS.services,
  moveServiceAction: CACHE_TAGS.services,
  setServiceVisibleAction: CACHE_TAGS.services,
  archiveServiceAction: CACHE_TAGS.services,
  restoreServiceAction: CACHE_TAGS.services,
  updateContentAction: CACHE_TAGS.pageContent,
  addReferenceAction: CACHE_TAGS.references,
  updateReferenceFullAction: CACHE_TAGS.references,
  moveReferenceAction: CACHE_TAGS.references,
  updateReferenceAction: CACHE_TAGS.references,
  deleteReferenceAction: CACHE_TAGS.references,
  setReferenceVisibleAction: CACHE_TAGS.references,
  archiveReferenceAction: CACHE_TAGS.references,
  restoreReferenceAction: CACHE_TAGS.references,
  updateSettingsAction: CACHE_TAGS.settings,
  createPostAction: CACHE_TAGS.posts,
  updatePostAction: CACHE_TAGS.posts,
  deletePostAction: CACHE_TAGS.posts,
  setPostPublishedAction: CACHE_TAGS.posts,
  archivePostAction: CACHE_TAGS.posts,
  restorePostAction: CACHE_TAGS.posts,
};

// Kullanici, oturum ve mesaj tablolari public icerigi etkilemez.
const ICERIK_DISI = [
  "loginAction", "verifyTwoFactorLoginAction", "signOutEverywhereAction", "changePasswordAction",
  "requestPasswordResetAction", "performPasswordResetAction", "startTwoFactorSetupAction",
  "confirmTwoFactorAction", "disableTwoFactorAction", "disableUserTwoFactorAction",
  "setMessageStatusAction", "updateMessageNotesAction", "deleteMessageAction", "bulkMessageAction",
  "moveMessageStatusAction", "archiveMessageAction", "restoreMessageAction",
  "createUserAction", "updateUserAction", "resetUserPasswordAction", "setUserRoleAction",
  "deleteUserAction", "archiveUserAction", "restoreUserAction",
];

let etiketEksik = 0;
for (const [ad, etiket] of Object.entries(ICERIK_ACTIONS)) {
  const govde = actionGovdeleri.get(ad);
  if (!govde) {
    fail(`${ad} etiketi temizliyor`, "action bulunamadi");
    etiketEksik++;
  } else if (!govde.includes("revalidateTag(" + sabitIfadesi.get(etiket) + ", { expire: 0 })")) {
    fail(`${ad} etiketi temizliyor`, `revalidateTag(${sabitIfadesi.get(etiket)}, { expire: 0 }) yok`);
    etiketEksik++;
  }
}
if (etiketEksik === 0) ok(`${Object.keys(ICERIK_ACTIONS).length} icerik action'i dogru etiketi temizliyor`);

let fazladan = 0;
for (const ad of ICERIK_DISI) {
  const govde = actionGovdeleri.get(ad);
  if (govde && govde.includes("revalidateTag(")) {
    fail(`${ad} etiket temizlemiyor`, "public icerigi etkilemiyor ama revalidateTag cagiriyor");
    fazladan++;
  }
}
if (fazladan === 0) ok(`${ICERIK_DISI.length} icerik disi action gereksiz etiket temizlemiyor`);

// Her mutasyon action'i iki listeden birinde olmali.
const mutasyonDeseni = /prisma\.[a-zA-Z]+\.(create|update|delete|upsert|createMany|updateMany|deleteMany)\b/;
const siniflandirilmamis: string[] = [];
for (const [ad, govde] of actionGovdeleri) {
  if (!mutasyonDeseni.test(govde)) continue;
  if (ad in ICERIK_ACTIONS || ICERIK_DISI.includes(ad)) continue;
  siniflandirilmamis.push(ad);
}
expect(siniflandirilmamis.join(","), "", "her mutasyon action'i siniflandirilmis");

expect(
  actions.includes('revalidateTag(') && !actions.includes('"max"'),
  true,
  "revalidateTag 'max' profiliyle cagrilmiyor (kayittan sonra bayat icerik servis edilmemeli)"
);

const kacakEtiket = (actions.match(/revalidateTag\(([^,)]*)/g) || []).filter(
  (c) => !c.includes("CACHE_TAGS.")
);
expect(kacakEtiket.join(","), "", "actions.ts'teki her revalidateTag CACHE_TAGS sabiti kullaniyor");

// Mevcut revalidatePath cagrilari korunmali (ileride ISR'a gecilirse gerekli).
expect(actions.includes('revalidatePath("/", "layout")'), true, "revalidatePath cagrilari duruyor");

console.log(failures ? `\n${failures} HATA` : "\nhata yok");
process.exit(failures ? 1 : 0);
