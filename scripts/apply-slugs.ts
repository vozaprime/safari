// Dile göre URL adlarını (slug) veritabanına uygular. Ortak slug üzerinden
// idempotent: tekrar çalıştırmak kayıt çoğaltmaz, yalnızca slug alanını yazar.
//
//   npx tsx scripts/apply-slugs.ts              → kuru çalışma, DB'ye YAZMAZ
//   npx tsx scripts/apply-slugs.ts --publish    → yazar
//
// Önce `npx prisma db push` ile ServiceTranslation.slug / PostTranslation.slug
// kolonlarının oluşturulmuş olması gerekir.
//
// DATABASE_URL ortamda tanımlı olmalıdır (.env varsa Prisma kendisi yükler).
import { PrismaClient } from "@prisma/client";
import { serviceSlugs, postSlugs, type SlugSet } from "../prisma/slugs";

const LOCALES = ["tr", "en", "ru"] as const;

const write = process.argv.includes("--publish");
const prisma = new PrismaClient();

/** Aynı dilde iki kaydın aynı slug'ı almasını, DB'ye gitmeden yakalar. */
function assertNoCollisions(label: string, sets: Record<string, SlugSet>) {
  for (const locale of LOCALES) {
    const seen = new Map<string, string>();
    for (const [key, set] of Object.entries(sets)) {
      const slug = set[locale];
      const clash = seen.get(slug);
      if (clash) throw new Error(`${label}: "${slug}" (${locale}) hem ${clash} hem ${key} için tanımlı`);
      seen.set(slug, key);
    }
  }
}

async function applyServices() {
  let written = 0;
  let missing = 0;
  for (const [sharedSlug, set] of Object.entries(serviceSlugs)) {
    const service = await prisma.service.findUnique({
      where: { slug: sharedSlug },
      include: { translations: { select: { locale: true, slug: true } } },
    });
    if (!service) {
      console.log(`  ATLANDI  ${sharedSlug} — bu slug ile hizmet yok`);
      missing++;
      continue;
    }
    for (const locale of LOCALES) {
      const current = service.translations.find((t) => t.locale === locale);
      if (!current) {
        console.log(`  ATLANDI  ${sharedSlug} [${locale}] — çeviri satırı yok`);
        continue;
      }
      if (current.slug === set[locale]) continue;
      console.log(`  ${current.slug ?? "(boş)"} → ${set[locale]}  [${locale}] ${sharedSlug}`);
      if (write) {
        await prisma.serviceTranslation.update({
          where: { serviceId_locale: { serviceId: service.id, locale } },
          data: { slug: set[locale] },
        });
      }
      written++;
    }
  }
  return { written, missing };
}

async function applyPosts() {
  let written = 0;
  let missing = 0;
  for (const [sharedSlug, set] of Object.entries(postSlugs)) {
    const post = await prisma.post.findUnique({
      where: { slug: sharedSlug },
      include: { translations: { select: { locale: true, slug: true } } },
    });
    if (!post) {
      console.log(`  ATLANDI  ${sharedSlug} — bu slug ile yazı yok`);
      missing++;
      continue;
    }
    for (const locale of LOCALES) {
      const current = post.translations.find((t) => t.locale === locale);
      if (!current) {
        console.log(`  ATLANDI  ${sharedSlug} [${locale}] — çeviri satırı yok`);
        continue;
      }
      if (current.slug === set[locale]) continue;
      console.log(`  ${current.slug ?? "(boş)"} → ${set[locale]}  [${locale}] ${sharedSlug}`);
      if (write) {
        await prisma.postTranslation.update({
          where: { postId_locale: { postId: post.id, locale } },
          data: { slug: set[locale] },
        });
      }
      written++;
    }
  }
  return { written, missing };
}

async function main() {
  assertNoCollisions("Hizmet", serviceSlugs);
  assertNoCollisions("Yazı", postSlugs);

  console.log(write ? "UYGULANIYOR (DB'ye yazılıyor)" : "KURU ÇALIŞMA (DB'ye yazılmıyor)");
  console.log(
    `${Object.keys(serviceSlugs).length} hizmet + ${Object.keys(postSlugs).length} yazı, ${LOCALES.length} dil\n`
  );

  console.log("Hizmetler:");
  const services = await applyServices();
  console.log("\nYazılar:");
  const posts = await applyPosts();

  const total = services.written + posts.written;
  const missing = services.missing + posts.missing;
  console.log(`\n${total} slug ${write ? "yazıldı" : "yazılacak"}, ${missing} kayıt bulunamadı.`);

  if (!write) {
    console.log("Hiçbir şey yazılmadı. Uygulamak için --publish ekleyin.");
    return;
  }

  // Yayın öncesi denetim: her dilde slug'sız kalan çeviri var mı?
  const [svcGaps, postGaps] = await Promise.all([
    prisma.serviceTranslation.count({ where: { slug: null, title: { not: "" } } }),
    prisma.postTranslation.count({ where: { slug: null, title: { not: "" } } }),
  ]);
  if (svcGaps || postGaps) {
    console.log(
      `UYARI: ${svcGaps} hizmet + ${postGaps} yazı çevirisi hâlâ slug'sız; bunlar ortak slug'a düşer.`
    );
  } else {
    console.log("Başlığı dolu tüm çevirilerin dil slug'ı var.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
