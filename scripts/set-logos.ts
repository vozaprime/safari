import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const logos: Record<string, string> = {
  "Türk Telekom": "/images/references/turk-telekom.svg",
  "Turkcell": "/images/references/turkcell.svg",
  "Vestel": "/images/references/vestel.svg",
  "Türk Hava Yolları (THY)": "/images/references/turkish-airlines.svg",
  "Altınbaş Holding": "/images/references/altinbas.svg",
};

async function main() {
  const refs = await prisma.reference.findMany();
  for (const ref of refs) {
    const logo = logos[ref.name] ?? "";
    await prisma.reference.update({ where: { id: ref.id }, data: { logo } });
    console.log(`${ref.name} -> ${logo || "(text)"}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
