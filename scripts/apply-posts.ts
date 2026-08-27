// Blog içeriklerini veritabanına uygular. Slug üzerinden idempotent upsert:
// tekrar çalıştırmak kayıt çoğaltmaz, mevcut yazıyı günceller.
//
//   npx tsx scripts/apply-posts.ts              → kuru çalışma, DB'ye YAZMAZ
//   npx tsx scripts/apply-posts.ts --publish    → yazar ve published=true yapar
//   npx tsx scripts/apply-posts.ts --publish --draft   → yazar, taslak bırakır
//
// DATABASE_URL ortamda tanımlı olmalıdır (.env varsa Prisma kendisi yükler).
import { PrismaClient } from "@prisma/client";
import { items as A } from "./content/blog-A";
import { items as B } from "./content/blog-B";
import { items as C } from "./content/blog-C";
import { items as D } from "./content/blog-D";
import { postSlugs } from "../prisma/slugs";

const LOCALES = ["tr", "en", "ru"] as const;
type Locale = (typeof LOCALES)[number];
type Translation = { title: string; excerpt: string; body: string };
type Item = { slug: string; cover: string } & Record<Locale, Translation>;

const all = [...A, ...B, ...C, ...D] as Item[];

const write = process.argv.includes("--publish");
const asDraft = process.argv.includes("--draft");

// Yayın sırası: listeleme createdAt'e göre azalan. Tüm yazılar aynı güne
// damgalanır, dizideki sırayı korumak için dakika kaydırılır — böylece
// gösterilen tarih gerçek yayın günüdür, uydurma bir arşiv geçmişi üretilmez.
const BASE = new Date("2026-08-27T12:00:00+03:00");
const stampFor = (index: number) => new Date(BASE.getTime() - index * 60_000);

const prisma = new PrismaClient();

async function main() {
  console.log(write ? "UYGULANIYOR (DB'ye yazılıyor)" : "KURU ÇALIŞMA (DB'ye yazılmıyor)");
  console.log(`${all.length} makale, ${LOCALES.length} dil\n`);

  let created = 0;
  let updated = 0;

  for (const [index, item] of all.entries()) {
    const existing = await prisma.post.findUnique({ where: { slug: item.slug } });
    const action = existing ? "güncelle" : "oluştur";
    const createdAt = stampFor(index);

    console.log(
      `${String(index + 1).padStart(2)}. [${action}] ${item.slug}` +
        `\n    kapak: ${item.cover}` +
        `\n    tarih: ${createdAt.toISOString()}` +
        `\n    tr: ${item.tr.title}`
    );

    if (!write) continue;

    const post = await prisma.post.upsert({
      where: { slug: item.slug },
      create: {
        slug: item.slug,
        cover: item.cover,
        published: !asDraft,
        order: index,
        createdAt,
      },
      update: {
        cover: item.cover,
        published: !asDraft,
        order: index,
        createdAt,
      },
    });
    if (existing) updated++;
    else created++;

    for (const locale of LOCALES) {
      const t = item[locale];
      // Per-locale URL name; null falls back to the shared slug. Kept in step
      // with apply-slugs.ts so re-running either script lands the same state.
      const slug = postSlugs[item.slug]?.[locale] ?? null;
      await prisma.postTranslation.upsert({
        where: { postId_locale: { postId: post.id, locale } },
        create: { postId: post.id, locale, title: t.title, excerpt: t.excerpt, body: t.body.trim(), slug },
        update: { title: t.title, excerpt: t.excerpt, body: t.body.trim(), slug },
      });
    }
  }

  if (!write) {
    console.log("\nHiçbir şey yazılmadı. Uygulamak için --publish ekleyin.");
    return;
  }

  console.log(`\n${created} oluşturuldu, ${updated} güncellendi.`);
  const live = await prisma.post.count({ where: { published: true } });
  console.log(`Yayındaki toplam yazı: ${live}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
