import type { NextConfig } from "next";

/**
 * Baseline HTTP security headers applied to every response. Vercel does not add
 * these automatically. CSP keeps 'unsafe-inline' for scripts/styles because the
 * app ships an inline Google Analytics bootstrap and Next.js inline hydration
 * scripts; it can be tightened to nonce-based later. 'unsafe-eval' is added only
 * in development (React's dev tooling needs eval(); production never does).
 * `img-src https:` is broad on purpose — admins may paste arbitrary image URLs
 * and Vercel Blob serves uploads from its own domain.
 */
const isDev = process.env.NODE_ENV !== "production";

const scriptSrc = ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : []), "https://www.googletagmanager.com"].join(" ");

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com",
  "frame-src 'self' https://www.google.com https://maps.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
]
  .join("; ")
  .concat(";");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

/**
 * `public/` altındaki dosyalar için önbellek politikası.
 *
 * Next bu dosyaları varsayılan olarak `public, max-age=0, must-revalidate` ile
 * sunuyor; yani ana sayfadaki ~17 MB video her ziyarette yeniden doğrulanıyordu.
 * Dosya adları içerik imzası taşımadığı için (`hero-journey.mp4` gibi) `immutable`
 * kullanmıyoruz: bir dosya aynı adla değiştirilirse ziyaretçiler eskisinde takılı
 * kalırdı. Bunun yerine makul bir tazelik süresi + `stale-while-revalidate`
 * veriyoruz; süre dolduğunda içerik arka planda yenilenir.
 *
 * DİKKAT: Bir medya dosyasını aynı adla değiştirirseniz, tazelik süresi boyunca
 * eski sürüm sunulmaya devam eder. Anında yansıması gerekiyorsa dosyaya yeni bir
 * ad verin (veya Vercel'den önbelleği temizleyin).
 */
const cacheRules = [
  // Videolar büyük ve nadiren değişir.
  { source: "/videos/:path*", value: "public, max-age=604800, stale-while-revalidate=2592000" },
  // Görseller ve marka varlıkları daha sık güncellenebilir.
  { source: "/images/:path*", value: "public, max-age=86400, stale-while-revalidate=604800" },
  { source: "/brand/:path*", value: "public, max-age=86400, stale-while-revalidate=604800" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      ...cacheRules.map((rule) => ({
        source: rule.source,
        headers: [{ key: "Cache-Control", value: rule.value }],
      })),
    ];
  },
};

export default nextConfig;
