// Hakkımızda anlatı metnini (about_body) üç dilde veritabanına uygular.
// Anahtar+dil üzerinden idempotent upsert: tekrar çalıştırmak kayıt çoğaltmaz.
//
//   npx tsx scripts/apply-about.ts            → kuru çalışma, DB'ye YAZMAZ
//   npx tsx scripts/apply-about.ts --write    → uygular
//
// DATABASE_URL ortamda tanımlı olmalıdır (.env varsa Prisma kendisi yükler).
//
// Yazma, üç dilin TAMAMI doğrulandıktan SONRA tek blokta yapılır. Denetim ve
// yazmanın aynı döngüde olduğu sürüm, tr'ye yazdıktan sonra en'de durabiliyor
// ve yine de "hiçbir şey yazılmadı" diyordu; yerel ve canlı aynı veritabanını
// paylaştığı için bu, canlı içeriğin dillere göre ayrışması demekti.
import { PrismaClient } from "@prisma/client";
import { parseBlocks } from "../src/lib/richtext";
import { aboutBody } from "./content/about";
import { allProblems } from "./content/validate-about";

const LOCALES = ["tr", "en", "ru"] as const;
const KEY = "about_body";

const write = process.argv.includes("--write");
const prisma = new PrismaClient();

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

async function main() {
  console.log(write ? "UYGULANIYOR (DB'ye yazılıyor)" : "KURU ÇALIŞMA (DB'ye yazılmıyor)");
  console.log("");

  const bodies = Object.fromEntries(LOCALES.map((l) => [l, aboutBody[l].trim()]));

  // 1) Önce hepsini denetle.
  const problems = allProblems(bodies);

  // 2) Ne yapılacağını raporla.
  for (const locale of LOCALES) {
    const value = bodies[locale];
    const paragraphs = parseBlocks(value).filter((b) => b.kind === "para").length;
    const existing = await prisma.pageContent.findUnique({
      where: { key_locale: { key: KEY, locale } },
    });
    const durum = existing
      ? existing.value.trim() === value
        ? "değişiklik yok"
        : "güncellenecek"
      : "oluşturulacak";
    console.log(`  ${locale}: ${words(value)} kelime, ${paragraphs} paragraf — ${durum}`);
    for (const p of problems.filter((x) => x.locale === locale)) {
      console.error(`       ! ${p.problem}`);
    }
  }

  if (problems.length) {
    console.error(`\n${problems.length} sorun bulundu, hiçbir şey yazılmadı.`);
    process.exitCode = 1;
    return;
  }

  if (!write) {
    console.log("\nHiçbir şey yazılmadı. Uygulamak için --write ekleyin.");
    return;
  }

  // 3) Yalnızca hepsi geçerliyse yaz; üçü tek işlemde, yarım kalmasın.
  await prisma.$transaction(
    LOCALES.map((locale) =>
      prisma.pageContent.upsert({
        where: { key_locale: { key: KEY, locale } },
        create: { key: KEY, locale, value: bodies[locale] },
        update: { value: bodies[locale] },
      })
    )
  );
  console.log("\nUygulandı.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
