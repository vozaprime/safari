import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { defaultLocale, locales } from "./lib/i18n";

function pickLocale(req: NextRequest): string {
  const header = req.headers.get("accept-language") ?? "";
  for (const part of header.split(",")) {
    const code = part.split(";")[0].trim().slice(0, 2).toLowerCase();
    if ((locales as readonly string[]).includes(code)) return code;
  }
  return defaultLocale;
}

export async function middleware(req: NextRequest) {
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*"],
};
