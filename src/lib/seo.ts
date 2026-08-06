import type { Locale } from "./i18n";
import { locales } from "./i18n";

export function altLanguages(path: string) {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = `/${l}${path}`;
  return { canonical: undefined, languages };
}

export function withLocalePath(locale: Locale, path: string) {
  return `/${locale}${path}`;
}
