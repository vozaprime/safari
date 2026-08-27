// Blog içeriklerinin yayın öncesi denetimi. DB'ye DOKUNMAZ.
//   npx tsx scripts/check-posts.ts
// Kontroller: dil başına kelime sayısı, mini-markdown ayrıştırması, zorunlu blok
// türleri, görsel yollarının public/ altında gerçekten var olması, slug tekilliği.
import { existsSync } from "fs";
import path from "path";
import { parseBlocks } from "../src/lib/richtext";
import { items as A } from "./content/blog-A";
import { items as B } from "./content/blog-B";
import { items as C } from "./content/blog-C";
import { items as D } from "./content/blog-D";

const LOCALES = ["tr", "en", "ru"] as const;
type Locale = (typeof LOCALES)[number];
type Translation = { title: string; excerpt: string; body: string };
type Item = { slug: string; cover: string } & Record<Locale, Translation>;

const all = [...A, ...B, ...C, ...D] as Item[];

const MIN_WORDS = 300;
/** Gövdede kullanılması yasak görseller (içinde bozuk AI metni var). */
const BANNED_IMAGES = ["/images/services/inline/charts.jpg"];

let failures = 0;
let warnings = 0;
const fail = (msg: string) => {
  console.error("  FAIL:", msg);
  failures++;
};
const warn = (msg: string) => {
  console.warn("  WARN:", msg);
  warnings++;
};

/** Görsel satırlarını ve markdown imlerini atıp gerçek kelime sayısını verir. */
function countWords(body: string): number {
  return body
    .split("\n")
    .filter((l) => !/^!\[[^\]]*\]\([^)\s]+\)$/.test(l.trim()))
    .join(" ")
    .replace(/\*\*|\*/g, " ")
    .replace(/^[>#-]+/gm, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

/** public/ altındaki bir varlığın diskte var olup olmadığı. */
const assetExists = (url: string) => existsSync(path.join(process.cwd(), "public", url.replace(/^\//, "")));

const seenSlugs = new Set<string>();

console.log(`${all.length} makale denetleniyor\n`);

for (const item of all) {
  console.log(`— ${item.slug}`);

  if (seenSlugs.has(item.slug)) fail(`slug tekrar ediyor: ${item.slug}`);
  seenSlugs.add(item.slug);

  if (!/^[a-z0-9-]+$/.test(item.slug)) fail(`slug yalnızca a-z, 0-9 ve tire içermeli: ${item.slug}`);

  if (!item.cover) fail("kapak görseli boş");
  else if (!assetExists(item.cover)) fail(`kapak görseli diskte yok: ${item.cover}`);

  const counts: string[] = [];

  for (const locale of LOCALES) {
    const t = item[locale];
    if (!t) {
      fail(`${locale} çevirisi eksik`);
      continue;
    }
    if (!t.title?.trim()) fail(`${locale}: başlık boş`);
    if (!t.excerpt?.trim()) fail(`${locale}: özet boş`);
    if (t.excerpt && t.excerpt.length > 200) warn(`${locale}: özet 200 karakterden uzun (${t.excerpt.length})`);

    const words = countWords(t.body || "");
    counts.push(`${locale} ${words}`);
    if (words < MIN_WORDS) fail(`${locale}: ${words} kelime, alt sınır ${MIN_WORDS}`);

    const blocks = parseBlocks(t.body || "");
    const headings = blocks.filter((b) => b.kind === "heading").length;
    const quotes = blocks.filter((b) => b.kind === "quote").length;
    const lists = blocks.filter((b) => b.kind === "list").length;
    const images = blocks.filter((b) => b.kind === "image");

    if (headings < 3) fail(`${locale}: ${headings} başlık, en az 3 bekleniyor`);
    if (quotes < 1) fail(`${locale}: alıntı bloğu yok`);
    if (lists < 1) fail(`${locale}: liste bloğu yok`);
    if (images.length !== 2) fail(`${locale}: ${images.length} görsel, tam olarak 2 bekleniyor`);

    for (const img of images) {
      if (img.kind !== "image") continue;
      if (!assetExists(img.src)) fail(`${locale}: görsel diskte yok: ${img.src}`);
      if (BANNED_IMAGES.includes(img.src)) fail(`${locale}: yasaklı görsel kullanılmış: ${img.src}`);
      if (img.src === item.cover) fail(`${locale}: kapakla aynı görsel makale içinde de kullanılmış: ${img.src}`);
      if (!img.alt.trim()) fail(`${locale}: görselin alt metni boş: ${img.src}`);
    }

    // Ham markdown gövdede kalmamalı: satır içi ![..](..) paragraf olarak render edilir.
    for (const b of blocks) {
      if (b.kind === "para" && b.text.includes("![")) {
        fail(`${locale}: satır içinde kalmış görsel var, kendi satırında olmalı`);
      }
    }
  }

  // Diller arası görsel tutarlılığı: üç dilde de aynı görseller kullanılmalı.
  const srcsOf = (locale: Locale) =>
    parseBlocks(item[locale]?.body || "")
      .filter((b) => b.kind === "image")
      .map((b) => (b.kind === "image" ? b.src : ""))
      .join("|");
  if (srcsOf("tr") !== srcsOf("en") || srcsOf("tr") !== srcsOf("ru")) {
    fail("diller arasında makale-içi görseller farklı");
  }

  console.log(`  kelime: ${counts.join(" · ")}`);
}

// Görsel kullanım dağılımı — tekrarın nerede yoğunlaştığını görmek için.
const usage = new Map<string, number>();
for (const item of all) {
  usage.set(item.cover, (usage.get(item.cover) ?? 0) + 1);
  for (const b of parseBlocks(item.tr?.body || "")) {
    if (b.kind === "image") usage.set(b.src, (usage.get(b.src) ?? 0) + 1);
  }
}
console.log("\nGörsel kullanım sayısı (kapak + TR makale içi):");
for (const [src, n] of [...usage.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(2)} × ${src}`);
}

console.log(`\n${failures ? `${failures} HATA` : "hata yok"}, ${warnings} uyarı`);
process.exit(failures ? 1 : 0);
