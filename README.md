# SAFARI CONSULTING — Kurumsal Web Sitesi + CMS

Çok dilli (TR / EN / RU) kurumsal danışmanlık sitesi ve kendi yönetim paneli. Tüm içerik —
sayfa metinleri, hizmetler, referanslar, blog, iletişim bilgileri — panelden yönetilir ve
anında yayına yansır.

**Canlı:** https://www.safarict.com · **Panel:** https://www.safarict.com/admin

> Mimarinin ayrıntısı, tamamlanan işler ve devam maddeleri için: [`docs/HANDOFF.md`](docs/HANDOFF.md)

## Teknolojiler

| Katman | Kullanılan |
|---|---|
| Framework | **Next.js 16** (App Router, Turbopack, sunucu tarafı render) |
| UI | **React 19**, **Tailwind CSS 4** (marka paleti: orman yeşili · altın · fildişi) |
| Veritabanı | **PostgreSQL** + **Prisma 6** |
| Kimlik doğrulama | `jose` (JWT oturum) + `bcryptjs`, **2FA/TOTP** (`otpauth` + `qrcode`) |
| Medya | **Vercel Blob** (görsel/dosya yükleme) |
| E-posta | `nodemailer` (iletişim formu bildirimi) |
| Etkileşim | `lenis` (yumuşak kaydırma) |
| Barındırma | **Vercel** (`vozas-projects/safari-consulting`) |

## Çalıştırma

```bash
npm install
npm run setup    # prisma generate + db push + seed (yalnızca ilk kurulum)
npm run dev      # http://localhost:3000
```

Diğer komutlar: `npm run build` · `npm run start` · `npm run lint` · `npm run db:push` · `npm run db:seed`

> ⚠️ **`npm run setup` dikkat:** Yerel ve canlı **aynı** PostgreSQL'i kullanır. `db push`
> canlı şemayı da değiştirir (alan ekleme güvenli, silme değil) ve `db:seed` mevcut içeriği
> ezebilir. Kurulu bir ortamda `npm install` + `npx prisma generate` yeterlidir.

## Ortam değişkenleri

`.env` (yerelde) / Vercel proje ayarları (canlıda):

| Değişken | Açıklama |
|---|---|
| `DATABASE_URL` | PostgreSQL bağlantı dizesi (`postgres://…?sslmode=require`) |
| `SESSION_SECRET` | Oturum imza anahtarı — üretimde rastgele ve gizli olmalı |
| `SITE_URL` | Yayın adresi; canonical/hreflang, OpenGraph, sitemap ve şifre sıfırlama bağlantıları bunu kullanır |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob erişimi (medya yükleme). Blob store **public** olmalı |

## Adresler

| Adres | Açıklama |
|---|---|
| `/` | Ziyaretçinin tarayıcı diline yönlendirir |
| `/tr` · `/en` · `/ru` | Ana sayfa (üç dil) |
| `/{dil}/about` · `/services` · `/services/{slug}` · `/references` · `/blog` · `/blog/{slug}` · `/contact` | İçerik sayfaları |
| `/{dil}/kvkk` · `/{dil}/cerez-politikasi` | KVKK aydınlatma metni ve çerez politikası |
| `/admin` | Yönetim paneli (giriş, 2FA, şifre sıfırlama dahil) |
| `/sitemap.xml` · `/robots.txt` | Otomatik üretilir |

Erişim kontrolü `src/proxy.ts` içindedir (Next 16'da `middleware.ts` yerine `proxy.ts`).

## Yönetim paneli

**Seed varsayılanı:** `admin@safariconsulting.com` / `SafariAdmin2026!` —
**ilk girişte Ayarlar'dan değiştirin** ve 2FA'yı açın. (Canlı ortamda bu bilgiler
değiştirilmiş olmalıdır; yukarıdaki yalnızca yeni bir kurulumun başlangıç değeridir.)

Panelden yönetilenler:

- **İçerik** — sayfa metinleri (3 dilde), 13 hizmetin başlık/özet/açıklama/kapsamı, referanslar, blog yazıları
- **İletişim talepleri** — yeni / okundu / yanıtlandı akışı, arşivleme, CSV dışa aktarma
- **Medya** — Vercel Blob'a görsel yükleme ve seçme
- **Kullanıcılar** — rol yönetimi, 2FA sıfırlama
- **Ayarlar** — iletişim bilgileri, sosyal medya, logo/favicon, SEO, Google Analytics, SMTP, şifre
- **Etkinlik** — denetim kaydı (`AuditLog`) ve giriş denemeleri (`LoginAttempt`)

İçerikli public sayfalar `force-dynamic`'tir; panelden yapılan değişiklik **redeploy
gerektirmeden** anında yayına yansır.

## E-posta bildirimleri

İletişim formu talepleri her durumda panelde listelenir. E-posta bildirimi için
**Ayarlar → E-posta Bildirimleri (SMTP)** doldurulmalıdır (ör. Gmail: `smtp.gmail.com`,
port 587, uygulama şifresi).

## Gizlilik ve güvenlik

- **KVKK uyumlu çerez onayı** — Google Analytics yalnızca ziyaretçi açık rıza verdikten sonra yüklenir; "Reddet" kabul ile eşit görünürlükte
- **HTTP güvenlik başlıkları** (`next.config.ts`) — CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-DNS-Prefetch-Control
- **2FA/TOTP**, oturum sürüm damgası (`tokenVersion`), giriş denemesi kaydı
- **Hata sınırları** — `[locale]/error.tsx` (3 dil), `admin/error.tsx`, `global-error.tsx`

## Erişilebilirlik ve hareket

Tüm animasyonlar `prefers-reduced-motion` altında kapanır (kaydırma animasyonları, yumuşak
kaydırma, "başa dön" geçişleri). Buton ve bağlantılarda görünür odak halkası ve
`aria-label` kullanılır.

## Yayına alma (deploy)

> ⚠️ **Vercel projesi bu GitHub reposuna BAĞLI DEĞİL.** `main`'e merge etmek production'a
> hiçbir şey çıkarmaz. Deploy ayrı ve elle bir adımdır.

```bash
git pull --ff-only                  # ana dizinde
npx vercel deploy --prod --yes      # ANA dizinden çalıştırın, worktree'den değil
```

**Neden ana dizin:** `.gitignore` tüm `*.mp4`/`*.mov`/`*.wav` dosyalarını yoksayar.
`public/videos/*.mp4` git'te değildir, yalnızca ana dizinde bulunur ve Vercel CLI çalışma
dizinindeki dosyaları yükler. Worktree'den deploy edilirse videolar production'da 404 olur.

Deploy sonrası canlıyı gerçekten doğrulayın — "merge edildi" ile "yayında" aynı şey değildir.

## Bilinen tuzaklar

- **Yerel ve canlı aynı veritabanını paylaşır** — şema değişikliği her iki ortamı da etkiler
- **`next dev`/`next start` çalışırken `prisma generate`** DLL kilidi (EPERM) verir; önce Next süreçlerini kapatın
- **Form metinleri CRLF gelir** — `src/lib/richtext.tsx` ve server action'lar `\r\n` → `\n` normalize eder
- **`site_logo` ayarı doluysa** yerleşik `/brand/logo.png` ezilir
- **Worktree'lerin kendi `node_modules`'u yoktur** (ana depoyu paylaşırlar); Turbopack build orada kök hatası verebilir
- **`Dockerfile` güncel değildir** — SQLite dönemine aittir ve her başlatmada `db push` + `seed` çalıştırır. Paylaşılan PostgreSQL ile bu yıkıcıdır; kullanmadan önce gözden geçirin. Güncel yayın yolu Vercel'dir.
