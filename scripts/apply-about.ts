// Hakkımızda anlatı metnini (about_body) üç dilde veritabanına uygular.
// Anahtar+dil üzerinden idempotent upsert: tekrar çalıştırmak kayıt çoğaltmaz.
//
//   npx tsx scripts/apply-about.ts            → kuru çalışma, DB'ye YAZMAZ
//   npx tsx scripts/apply-about.ts --write    → uygular
//
// DATABASE_URL ortamda tanımlı olmalıdır (.env varsa Prisma kendisi yükler).
import { PrismaClient } from "@prisma/client";
import { parseBlocks } from "../src/lib/richtext";
import { aboutBody } from "./content/about";

const LOCALES = ["tr", "en", "ru"] as const;
const KEY = "about_body";

const write = process.argv.includes("--write");
const prisma = new PrismaClient();

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

async function main() {
  console.log(write ? "UYGULANIYOR (DB'ye yazılıyor)" : "KURU ÇALIŞMA (DB'ye yazılmıyor)");
  console.log("");

  let failures = 0;

  for (const locale of LOCALES) {
    const value = aboutBody[locale].trim();
    const blocks = parseBlocks(value);
    const paras = blocks.filter((b) => b.kind === "para").length;

    // Gövde düz paragraflardan oluşmalı: başlık/liste/alıntı/görsel beklemiyoruz.
    const unexpected = blocks.filter((b) => b.kind !== "para");
    if (unexpected.length) {
      console.error(`  ! ${locale}: beklenmeyen blok türü: ${unexpected.map((b) => b.kind).join(", ")}`);
      failures++;
    }
    if (paras < 5) {
      console.error(`  ! ${locale}: yalnızca ${paras} paragraf, en az 5 bekleniyor`);
      failures++;
    }

    const existing = await prisma.pageContent.findUnique({
      where: { key_locale: { key: KEY, locale } },
    });
    const durum = existing ? (existing.value.trim() === value ? "değişiklik yok" : "güncellenecek") : "oluşturulacak";
    console.log(`  ${locale}: ${words(value)} kelime, ${paras} paragraf — ${durum}`);
    if (existing && existing.value.trim() !== value) {
      console.log(`       (mevcut: ${words(existing.value)} kelime, ${parseBlocks(existing.value).length} blok)`);
    }

    if (!write || failures) continue;
    await prisma.pageContent.upsert({
      where: { key_locale: { key: KEY, locale } },
      create: { key: KEY, locale, value },
      update: { value },
    });
  }

  if (failures) {
    console.error(`\n${failures} sorun bulundu, hiçbir şey yazılmadı.`);
    process.exitCode = 1;
    return;
  }
  console.log(write ? "\nUygulandı." : "\nHiçbir şey yazılmadı. Uygulamak için --write ekleyin.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
