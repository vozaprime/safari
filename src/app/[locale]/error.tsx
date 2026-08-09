"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Localized error boundary for the public site. Catches unexpected errors thrown
 * while rendering any page under /[locale] (e.g. malformed CMS JSON, a transient
 * DB failure) so visitors get a branded, on-brand recovery screen instead of the
 * default unstyled Next.js error page.
 */

const messages = {
  tr: {
    title: "Bir şeyler ters gitti",
    text: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin; sorun sürerse birkaç dakika sonra yeniden ziyaret edin.",
    retry: "Tekrar dene",
    home: "Ana sayfaya dön",
  },
  en: {
    title: "Something went wrong",
    text: "An unexpected error occurred. Please try again; if it persists, come back in a few minutes.",
    retry: "Try again",
    home: "Back to home",
  },
  ru: {
    title: "Что-то пошло не так",
    text: "Произошла непредвиденная ошибка. Пожалуйста, попробуйте ещё раз; если проблема повторяется, вернитесь через несколько минут.",
    retry: "Повторить",
    home: "На главную",
  },
} as const;

type Loc = keyof typeof messages;

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to the server/telemetry; the message itself is never shown to users.
    console.error(error);
  }, [error]);

  const seg = typeof window !== "undefined" ? window.location.pathname.split("/")[1] : "tr";
  const locale: Loc = seg === "en" || seg === "ru" ? seg : "tr";
  const t = messages[locale];

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
      <p aria-hidden="true" className="mb-5 font-display text-6xl text-gold">
        ⚠
      </p>
      <h1 className="mb-3 font-display text-3xl text-ink">{t.title}</h1>
      <p className="mb-8 max-w-md text-sm leading-relaxed text-stone">{t.text}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-gold px-7 py-3.5 text-sm font-medium text-gold-ink transition-colors hover:bg-gold-dark hover:text-ivory"
        >
          {t.retry}
        </button>
        <Link
          href={`/${locale}`}
          className="rounded-md border border-sand px-7 py-3.5 text-sm font-medium text-ink transition-colors hover:border-gold"
        >
          {t.home}
        </Link>
      </div>
    </div>
  );
}
