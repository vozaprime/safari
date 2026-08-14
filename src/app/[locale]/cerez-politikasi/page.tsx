import type { Metadata } from "next";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n";
import { getSettings } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { cookiePolicy } from "@/lib/legal";
import LegalArticle from "@/components/LegalArticle";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  return pageMetadata({ locale, path: "/cerez-politikasi", title: cookiePolicy[locale].title });
}

export default async function CookiePolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const settings = await getSettings();
  return <LegalArticle locale={locale} doc={cookiePolicy[locale]} settings={settings} />;
}
