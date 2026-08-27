import "../globals.css";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";
import CookieConsent from "@/components/CookieConsent";
import ScrollToTop from "@/components/ScrollToTop";
import { defaultLocale, getDict, isLocale, localePath, siteDescriptions, type Locale } from "@/lib/i18n";
import { countPublishedPosts, getServices, getSettings } from "@/lib/content";
import { DEFAULT_OG_IMAGE, SITE_URL } from "@/lib/seo";
import { inter, playfair } from "@/lib/fonts";

export const dynamic = "force-dynamic";

const OG_LOCALE: Record<Locale, string> = { tr: "tr_TR", en: "en_US", ru: "ru_RU" };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const settings = await getSettings();
  const siteName = settings.seo_title || "SAFARI CONSULTING";
  const description = settings.seo_description || siteDescriptions[locale];

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description,
    icons: settings.site_favicon ? { icon: settings.site_favicon } : undefined,
    openGraph: {
      siteName,
      type: "website",
      locale: OG_LOCALE[locale],
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      description,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) redirect(`/${defaultLocale}`);
  const locale = raw as Locale;
  const t = getDict(locale);
  const [settings, blogCount, services] = await Promise.all([
    getSettings(),
    countPublishedPosts(locale),
    getServices(locale),
  ]);

  const gaId = settings.ga_id?.trim();

  return (
    <html lang={locale} data-scroll-behavior="smooth" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <SmoothScroll />
        <Nav
          locale={locale}
          labels={t.nav}
          logo={settings.site_logo}
          logoHeight={Number(settings.logo_height) || undefined}
          services={services.map((s) => ({ slug: s.slug, title: s.title }))}
          showBlog={blogCount > 0}
        />
        <main className="pt-[72px]">{children}</main>
        <Footer locale={locale} settings={settings} />
        {/* GA is loaded from inside CookieConsent, and only after the visitor
            accepts analytics cookies (KVKK açık rıza). */}
        <CookieConsent gaId={gaId} labels={t.cookie} policyHref={localePath(locale, "cerez-politikasi")} />
        <ScrollToTop label={t.ui.back_to_top} />
      </body>
    </html>
  );
}
