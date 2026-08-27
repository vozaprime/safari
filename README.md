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

### İçerik scriptleri

Uzun metinler panelden değil, dosyadan toplu uygulanır. İçerik `scripts/content/` altında
durur; uygulama scriptleri slug üzerinden **idempotent** çalışır (tekrar çalıştırmak kayıt
çoğaltmaz).

```bash
npx tsx scripts/check-posts.ts             # blog denetimi — DB'ye dokunmaz
npx tsx scripts/apply-posts.ts             # kuru çalışma, ne yapacağını yazar
npx tsx scripts/apply-posts.ts --publish   # uygular ve yayına alır (--draft ile taslak)
npx tsx scripts/apply-descriptions.ts      # hizmet açıklamalarını uygular
npx tsx scripts/apply-slugs.ts             # dil slug'ları — kuru çalışma
npx tsx scripts/apply-slugs.ts --publish   # dil slug'larını yazar
npx tsx scripts/check-richtext-images.ts   # mini-markdown ayrıştırıcı testleri
```

`check-posts.ts` şunları doğrular: dil başına en az 300 kelime, her dilde 3+ başlık ·
1+ alıntı · 1+ liste · tam 2 makale-içi görsel, görsel yollarının `public/` altında
gerçekten var olması, kapak görselinin makale içinde tekrar kullanılmaması ve üç dilde
aynı görsellerin kullanılması. **Yayın öncesi çalıştırın** — hata varsa çıkış kodu 1'dir.

> ⚠️ `--publish` doğrudan **canlı** veritabanına yazar. Blog sayfaları `force-dynamic`
> olduğu için içerik deploy beklemeden anında yayına girer.

## Ortam değişkenleri

`.env` (yerelde) / Vercel proje ayarları (canlıda):

| Değişken | Açıklama |
|---|---|
| `DATABASE_URL` | PostgreSQL bağlantı dizesi (`postgres://…?sslmode=require`) |
| `SESSION_SECRET` | Oturum imza anahtarı — üretimde rastgele ve gizli olmalı |
| `SITE_URL` | Yayın adresi; canonical/hreflang, OpenGraph, sitemap ve şifre sıfırlama bağlantıları bunu kullanır. Boş bırakılırsa üretimde `https://www.safarict.com`, yerelde `http://localhost:3000` kullanılır; üretimde `*.vercel.app` değeri **yok sayılır** (bkz. `src/lib/seo.ts`) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob erişimi (medya yükleme). Blob store **public** olmalı |

## Adresler

| Adres | Açıklama |
|---|---|
| `/` | Ziyaretçinin tarayıcı diline yönlendirir |
| `/tr` · `/en` · `/ru` | Ana sayfa (üç dil) |
| İçerik sayfaları | Her dil kendi yazımını kullanır — aşağıdaki tabloya bakın |
| `/{dil}/{hizmet-yolu}/{slug}` · `/{dil}/{blog-yolu}/{slug}` | Hizmet ve blog detayları — slug da dile göre değişir |
| `/admin` | Yönetim paneli (giriş, 2FA, şifre sıfırlama dahil) |
| `/sitemap.xml` · `/robots.txt` | Otomatik üretilir |

Yol adları dile göre değişir; tek kaynak `routeSegments` (`src/lib/i18n.ts`):

| Rota | tr | en | ru |
|---|---|---|---|
| Hakkımızda | `hakkimizda` | `about` | `o-nas` |
| Hizmetler | `hizmetlerimiz` | `services` | `uslugi` |
| Referanslar | `referanslarimiz` | `references` | `referensy` |
| Blog | `blog` | `blog` | `blog` |
| İletişim | `iletisim` | `contact` | `kontakty` |
| Çerez politikası | `cerez-politikasi` | `cookie-policy` | `politika-cookie` |
| KVKK | `kvkk` | `data-protection` | `zashchita-dannykh` |

Rota klasörleri (`src/app/[locale]/…`) İngilizce adlarında kalır; `src/proxy.ts`
ziyaretçinin gördüğü yolu klasör adına **rewrite** eder ve başka bir dilin
yazımıyla gelen adresleri (ör. eski `/tr/about`) **308** ile doğru yola
yönlendirir. Link üretirken yolu elle yazmayın — `localePath(locale, "about")`
kullanın; canonical/hreflang ve sitemap da aynı kaynaktan beslenir.

Hizmet ve yazı slug'ları da dile göredir; bunlar veritabanında durur
(`ServiceTranslation.slug` / `PostTranslation.slug`) ve panelde her dil
sekmesinde **URL adı** alanından düzenlenir. Alan boşsa kaydın ortak slug'ı
kullanılır. Bir dilin tanımadığı slug (başka dilin yazımı ya da yeniden
adlandırmadan önceki ad) sayfada **308** ile doğru adrese gider — örnek:
`/en/services/mali-danismanlik` → `/en/services/financial-advisory`.

Mevcut 26 kaydın dil slug'ları `prisma/slugs.ts` içinde tanımlıdır;
`scripts/apply-slugs.ts` bunları veritabanına yazar (varsayılan kuru çalışma,
yazmak için `--publish`). `prisma/seed.ts` ve `scripts/apply-posts.ts` de aynı
kaynaktan beslenir, böylece sıfırdan kurulum da yerelleştirilmiş adres üretir.

Erişim kontrolü de `src/proxy.ts` içindedir (Next 16'da `middleware.ts` yerine `proxy.ts`).

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
- **Menüdeki Blog linki koşulludur** — yayında hiç yazı yoksa (`published=true` ve arşivlenmemiş) link hiç render edilmez (`src/app/[locale]/layout.tsx` → `showBlog`). Link "kayboldu" diyorsanız önce yazıların yayın durumuna bakın
- **`next dev`/`next start` çalışırken `prisma generate`** DLL kilidi (EPERM) verir; önce Next süreçlerini kapatın
- **Form metinleri CRLF gelir** — `src/lib/richtext.tsx` ve server action'lar `\r\n` → `\n` normalize eder
- **`site_logo` ayarı doluysa** yerleşik `/brand/logo.png` ezilir
- **Worktree'lerin kendi `node_modules`'u yoktur** (ana depoyu paylaşırlar); Turbopack build orada kök hatası verebilir
- **`Dockerfile` güncel değildir** — SQLite dönemine aittir ve her başlatmada `db push` + `seed` çalıştırır. Paylaşılan PostgreSQL ile bu yıkıcıdır; kullanmadan önce gözden geçirin. Güncel yayın yolu Vercel'dir.
