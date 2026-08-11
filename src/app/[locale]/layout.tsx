import "../globals.css";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";
import { defaultLocale, getDict, isLocale, siteDescriptions, type Locale } from "@/lib/i18n";
import { countPublishedPosts, getSettings } from "@/lib/content";
import { DEFAULT_OG_IMAGE } from "@/lib/seo";
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
    metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
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
  const [settings, blogCount] = await Promise.all([getSettings(), countPublishedPosts()]);

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
          showBlog={blogCount > 0}
        />
        <main className="pt-[72px]">{children}</main>
        <Footer locale={locale} settings={settings} />
        {gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`,
              }}
            />
          </>
        )}
      </body>
    </html>
  );
}
