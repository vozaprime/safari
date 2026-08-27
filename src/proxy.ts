import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import {
  defaultLocale,
  isLocale,
  isRouteKey,
  locales,
  localePath,
  routeKeyFromSegment,
  type Locale,
} from "./lib/i18n";

function pickLocale(req: NextRequest): string {
  const header = req.headers.get("accept-language") ?? "";
  for (const part of header.split(",")) {
    const code = part.split(";")[0].trim().slice(0, 2).toLowerCase();
    if ((locales as readonly string[]).includes(code)) return code;
  }
  return defaultLocale;
}

/**
 * Maps the visitor-facing URL onto the physical route folders.
 *
 * Route folders are named in English (`src/app/[locale]/about`) but every locale
 * shows its own spelling (`/tr/hakkimizda`, `/ru/o-nas`). Two cases:
 *
 *  - the segment IS this locale's spelling → rewrite to the folder name, the
 *    address bar keeps the localized URL;
 *  - the segment is some OTHER locale's spelling (including the old, pre-launch
 *    English/Turkish URLs) → 308 to this locale's spelling, so each page keeps
 *    exactly one indexable address.
 *
 * Anything unrecognised falls through untouched and 404s as before.
 */
function localizedRoute(req: NextRequest, locale: Locale, segments: string[]) {
  const segment = segments[2];
  if (!segment) return null;

  const key = routeKeyFromSegment(locale, segment);
  if (key) {
    if (key === segment) return null; // folder name and spelling already agree
    const url = req.nextUrl.clone();
    url.pathname = ["", locale, key, ...segments.slice(3)].join("/");
    return NextResponse.rewrite(url);
  }

  // Not this locale's spelling. If it is a known route name in any form, the
  // visitor followed a stale link — send them to the right one, permanently.
  const stale = isRouteKey(segment)
    ? segment
    : locales.map((l) => routeKeyFromSegment(l, segment)).find(Boolean) ?? null;
  if (!stale) return null;

  const url = req.nextUrl.clone();
  url.pathname = localePath(locale, stale, segments.slice(3).join("/") || undefined);
  return NextResponse.redirect(url, 308);
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const publicAdmin =
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/admin/forgot") ||
    pathname.startsWith("/admin/reset") ||
    pathname.startsWith("/admin/2fa"); // mid-login TOTP step: guarded by its own pending-2FA cookie

  if (pathname.startsWith("/admin") && !publicAdmin) {
    const token = req.cookies.get("sc_session")?.value;
    let valid = false;
    if (token && process.env.SESSION_SECRET) {
      try {
        await jwtVerify(token, new TextEncoder().encode(process.env.SESSION_SECRET));
        valid = true;
      } catch {
        valid = false;
      }
    }
    if (!valid) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = `/${pickLocale(req)}`;
    return NextResponse.redirect(url);
  }

  const segments = pathname.split("/");
  if (isLocale(segments[1])) {
    const response = localizedRoute(req, segments[1], segments);
    if (response) return response;
  }

  return NextResponse.next();
}

// Matcher values must be static literals, so the locale prefixes are spelled out
// here rather than derived from `locales` — keep the two in sync.
export const config = {
  matcher: ["/", "/admin/:path*", "/tr/:path*", "/en/:path*", "/ru/:path*"],
};
