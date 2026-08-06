import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { locales } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL || "http://localhost:3000";
  const [services, posts] = await Promise.all([
    prisma.service.findMany({ where: { visible: true }, select: { slug: true } }),
    prisma.post.findMany({ where: { published: true }, select: { slug: true } }),
  ]);

  const staticPaths = ["", "/about", "/services", "/references", "/contact", "/blog"];
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const p of staticPaths) {
      entries.push({ url: `${base}/${locale}${p}`, changeFrequency: "monthly", priority: p === "" ? 1 : 0.7 });
    }
    for (const s of services) {
      entries.push({ url: `${base}/${locale}/services/${s.slug}`, changeFrequency: "monthly", priority: 0.6 });
    }
    for (const post of posts) {
      entries.push({ url: `${base}/${locale}/blog/${post.slug}`, changeFrequency: "weekly", priority: 0.6 });
    }
  }
  return entries;
}
