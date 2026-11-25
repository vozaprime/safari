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

// Sayim: her okuma icin tam bir unstable_cache cagrisi olmali.
const sarmalayiciSayisi = (content.match(/unstable_cache\(/g) || []).length;
expect(sarmalayiciSayisi, SARMALANACAK.length, `unstable_cache cagrisi sayisi ${SARMALANACAK.length}`);

// Etiket olarak yalnizca CACHE_TAGS sabitleri kullanilmali: duz string yazim
// hatasi revalidateTag'i sessizce etkisiz birakir.
const etiketBloklari = content.match(/tags:\s*\[[^\]]*\]/g) || [];
if (etiketBloklari.length === 0) {
  fail("etiketler CACHE_TAGS'ten geliyor", "hic 'tags: [...]' blogu yok");
} else {
  const kirli = etiketBloklari.filter((b) => /tags:\s*\[\s*(?!CACHE_TAGS\.)/.test(b));
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

console.log(failures ? `\n${failures} HATA` : "\nhata yok");
process.exit(failures ? 1 : 0);
