import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  const t = await p.postTranslation.findFirst({ where: { locale: "tr" }, orderBy: { id: "asc" } });
  const b = t?.body ?? "";
  console.log("len", b.length);
  console.log("has \\n\\n:", b.includes("\n\n"));
  console.log("has \\n \\n:", b.includes("\n \n"));
  console.log("around:", JSON.stringify(b.slice(95, 120)));
  await p.$disconnect();
})();
