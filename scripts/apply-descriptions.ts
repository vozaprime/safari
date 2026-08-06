import { PrismaClient } from "@prisma/client";
import { items as A } from "./content/content-A";
import { items as B } from "./content/content-B";
import { items as C } from "./content/content-C";
import { items as D } from "./content/content-D";
import { items as E } from "./content/content-E";

const prisma = new PrismaClient();

type Item = { slug: string; tr: string; en: string; ru: string };
const all: Item[] = [...A, ...B, ...C, ...D, ...E];

const words = (s: string) => s.replace(/[#>]/g, " ").split(/\s+/).filter(Boolean).length;

async function main() {
  console.log("slug".padEnd(34), "TR", "EN", "RU");
  let warnings = 0;
  for (const it of all) {
    const tr = words(it.tr);
    const en = words(it.en);
    const ru = words(it.ru);
    const flag = tr < 600 ? "  <-- TR under 600" : "";
    if (tr < 600) warnings++;
    console.log(it.slug.padEnd(34), tr, en, ru, flag);

    for (const locale of ["tr", "en", "ru"] as const) {
      const service = await prisma.service.findUnique({ where: { slug: it.slug } });
      if (!service) {
        console.log("  ! service not found:", it.slug);
        continue;
      }
      await prisma.serviceTranslation.update({
        where: { serviceId_locale: { serviceId: service.id, locale } },
        data: { description: it[locale].trim() },
      });
    }
  }
  console.log(`\nApplied ${all.length} services. TR-under-600 count: ${warnings}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
