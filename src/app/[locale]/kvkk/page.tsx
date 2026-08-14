import type { Metadata } from "next";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n";
import { getSettings } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { kvkkNotice } from "@/lib/legal";
import LegalArticle from "@/components/LegalArticle";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  return pageMetadata({ locale, path: "/kvkk", title: kvkkNotice[locale].title });
}

export default async function KvkkPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const settings = await getSettings();
  return <LegalArticle locale={locale} doc={kvkkNotice[locale]} settings={settings} />;
}
