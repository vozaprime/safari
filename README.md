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
npx tsx scripts/apply-about.ts             # kuru çalışma (--write ile Hakkımızda metnini uygular)
npx tsx scripts/apply-slugs.ts             # dil slug'ları — kuru çalışma
npx tsx scripts/apply-slugs.ts --publish   # dil slug'larını yazar
npx tsx scripts/check-richtext-images.ts   # mini-markdown ayrıştırıcı testleri
npx tsx scripts/check-social-url.ts        # sosyal medya bağlantı doğrulayıcı testleri
npx tsx scripts/check-story-scenes.ts      # sahne/şerit/ilerleme mantığı testleri
npx tsx scripts/check-story-scroll.ts      # StoryScroll işaretleme testleri (react-dom/server)
npx tsx scripts/check-apply-about.ts       # Hakkımızda gövde doğrulayıcısı testleri
npx tsx scripts/check-db-url.ts            # bağlantı havuzu parametreleri testleri
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
| `DATABASE_CONNECTION_LIMIT` | İsteğe bağlı. Instance başına havuz boyutu; varsayılan **1**. Yalnızca doğrudan (`postgres://`) bağlantıda uygulanır — bkz. *Veritabanı bağlantı havuzu* |
| `DATABASE_POOL_TIMEOUT` | İsteğe bağlı. Boş bağlantı beklerken saniye cinsinden tavan; varsayılan **20** |

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

## Veritabanı bağlantı havuzu

Prisma Postgres'te **doğrudan** (`postgres://…@db.prisma.io:5432`) bağlantı limiti
plana göre 10 / 10 / 50 / 100'dür ve bunların **5'i platform işlemlerine ayrılmıştır**.
Free veya Starter'da uygulamaya fiilen ~5 bağlantı kalır.

Prisma ORM 6'nın varsayılan havuzu instance başına `CPU×2+1` (≈5-9) açar. Sitedeki
13 sayfa `force-dynamic` olduğundan her istek veritabanına gider, dolayısıyla **tek bir
serverless instance bütçenin tamamını tüketebilir.** 17 Kasım 2026'da bütün sayfalar bu
yüzden `too many connections for role "prisma_migration"` ile 500 döndü. Yerel geliştirme
de aynı veritabanını kullandığı için açık kalan bir `next dev` bütçenin yarısını tutar.

`src/lib/dbUrl.ts` bu yüzden çalışma zamanında dizeye `connection_limit` ve `pool_timeout`
ekler (`src/lib/db.ts` → `datasourceUrl`). Şema ham `DATABASE_URL`'i okumaya devam eder,
böylece `prisma migrate` sınırsız doğrudan bağlantıyı kullanır.

Sınırın bedeli ölçüldü (yerel dev sunucusu, `/tr/hakkimizda`):

| Ayar | Tekil istek | 8 eşzamanlı istek, en yavaş |
|---|---|---|
| `connection_limit=1` | 0,62 s | **8,08 s** |
| `connection_limit=3` | 0,35 s | **1,50 s** |

Varsayılan **1**'dir: kesinti yerine kuyruk oluşturur, yani yavaşlar ama çökmez. Prisma'nın
serverless önerisi de budur. Planınız Pro veya üzeriyse (50-100 doğrudan bağlantı) bu
fedakârlık gereksizdir — `DATABASE_CONNECTION_LIMIT=5` yeterlidir.

**Kalıcı çözüm havuzlu bağlantıdır.** Prisma Console'dan alınan
`prisma+postgres://…?api_key=…` dizesine geçildiğinde limitler 10 / 100 / 500 / 1000'e
çıkar ve bu ödünleşme ortadan kalkar. `applyPoolLimits` havuzlu dizeye **dokunmaz**, bu
yüzden geçişte kod değişikliği gerekmez: dize değişince emniyet kemeri kendiliğinden
devre dışı kalır.

> Prisma ORM 7'de `connection_limit`/`pool_timeout` URL parametrelerinin yerini driver
> adapter'ın `max` ve `idleTimeoutMillis` ayarları alır; o yükseltmede `src/lib/dbUrl.ts`
> elden geçirilmeli.

## Statik dosya önbelleği

`next.config.ts` içindeki `cacheRules`, `public/` altındaki medyaya `Cache-Control` verir.
Next bu dosyaları varsayılan olarak `max-age=0, must-revalidate` ile sunar; ana sayfadaki
~17 MB video bu yüzden her ziyarette yeniden doğrulanıyordu.

| Yol | Politika |
|---|---|
| `/videos/*` | 7 gün taze + 30 gün `stale-while-revalidate` |
| `/images/*`, `/brand/*` | 1 gün taze + 7 gün `stale-while-revalidate` |

Dosya adları içerik imzası taşımadığı için `immutable` **kullanılmaz**. Bir medya dosyasını
**aynı adla** değiştirirseniz ziyaretçiler tazelik süresi boyunca eskisini görmeye devam
eder; anında yansıması gerekiyorsa dosyaya yeni bir ad verin veya Vercel'den önbelleği
temizleyin.

## Hakkımızda sahne görselleri

Hakkımızda sayfasındaki hikâye bölümü (`src/components/StoryScroll.tsx`), okuma
ilerledikçe çapraz geçişle değişen dört sahne görseli kullanır. Görseller
**Ayarlar → Marka & SEO → Hakkımızda sahne görselleri** altından yönetilir ve
`Setting` tablosunda tutulur:

| Anahtar | Sahnenin anlatıdaki yeri |
|---|---|
| `about_scene_1` | kuruluş ve geçmiş |
| `about_scene_2` | bugünün hizmetleri |
| `about_scene_3` | çözüm ortaklıkları ve değerler |
| `about_scene_4` | gelecek vizyonu |

`Setting` dilden bağımsız olduğu için görseller üç dilde ortaktır — bir görseli
değiştirmek tek işlemdir. Boş bırakılan bir sahne `src/lib/storyScenes.ts`
içindeki varsayılana düşer, dolayısıyla panel hiç kullanılmamışken de bölüm
eksiksiz görünür. Sayfa `force-dynamic` olduğu için değişiklik deploy
beklemeden yansır.

Metne panelden gömülen görseller (`![](url)`) anlatı akışından çıkarılıp sahne
havuzunun sonuna eklenir; hiçbir görsel kaybolmaz.

## Erişilebilirlik ve hareket

Tüm animasyonlar `prefers-reduced-motion` altında kapanır (kaydırma animasyonları, yumuşak
kaydırma, "başa dön" geçişleri). Buton ve bağlantılarda görünür odak halkası ve
`aria-label` kullanılır.

## Yayına alma (deploy)

`main` dalına yapılan merge **otomatik production deploy tetikler.** Doğrulama
(2026-11-17 16:23 UTC): PR #9 merge edildikten 1-2 dakika sonra, yalnızca o merge
commit'inde bulunan altı video canlıda 200 ve doğru byte boyutlarıyla servis edilmeye
başladı; hiçbir CLI komutu çalıştırılmadı.

Elle deploy de mümkün. PowerShell 5.1'de `&&` **çalışmaz**, ayırıcı `;` kullanın:

```powershell
Set-Location "D:\PROJELER\SAFARI CONSULTING"; git pull --ff-only; npx vercel deploy --prod --yes
```

**Her iki yolda da build kaynağı depodur, çalışma dizininiz değil.** Proje
`.vercel/repo.json` ile repo seviyesinde bağlı. 17 Kasım 2026 16:11'de worktree içinden
elle çalıştırılan bir deploy'dan sonra canlıya `main`'in ağacı çıktı: o worktree'de duran
PR #8 kodu canlıda görünmedi, `main`'de merge edilmiş PR #7 göründü. Sonuç: **yalnızca
commit edilmiş dosyalar yayına gider.** Commit edilmemiş bir değişikliği veya gitignore'lu
bir dosyayı deploy ederek canlıya çıkaramazsınız.

**Sahne videoları git'tedir.** `.gitignore` ham medyayı (`*.mp4`, `*.mov`, `*.wav`,
`*.m4a`) yoksayar, ancak `!public/videos/*.mp4` istisnası altı sahne videosunu depoda
tutar. Bunlar yayının parçasıdır: depoda olmazlarsa git kaynaklı deploy onları götürmez
ve ana sayfa ile Hakkımızda'daki video alanları boşalır. 17 Kasım 2026'da tam olarak bu
oldu — `/videos/*.mp4` adresleri videonun yerine 404 sayfasının HTML'ini döndürdü.

`public/videos/` altına yeni video eklerken dosyayı **commit edin.** İstisna yalnızca bu
klasörün birinci seviyesini ve `.mp4` uzantısını kapsar; alt klasörler ve `.mov` dışındadır.

Deploy sonrası canlıyı gerçekten doğrulayın — "merge edildi" ile "yayında" aynı şey değildir:

```bash
curl -sI https://www.safarict.com/videos/about-hero.mp4 | grep -i content-type
```

`video/mp4` görmelisiniz. `text/html` dosyanın deploy'a girmediği anlamına gelir.

## Bilinen tuzaklar

- **Yerel ve canlı aynı veritabanını paylaşır** — şema değişikliği her iki ortamı da etkiler
- **Menüdeki Blog linki koşulludur** — yayında hiç yazı yoksa (`published=true` ve arşivlenmemiş) link hiç render edilmez (`src/app/[locale]/layout.tsx` → `showBlog`). Link "kayboldu" diyorsanız önce yazıların yayın durumuna bakın
- **`next dev`/`next start` çalışırken `prisma generate`** DLL kilidi (EPERM) verir; önce Next süreçlerini kapatın. `npm run build` bu durumda `prisma generate` aşamasında durur ve `next build` hiç çalışmaz — "build geçti" sanıp eski `.next` çıktısını test etmemek için logda `EPERM` arayın
- **`package.json` → `overrides` bloğu güvenlik içindir** — `zod` ve `deepmerge-ts`, üst paketlerin (`@vercel/blob` → `@vercel/oidc` → `@vercel/cli-config` ve `prisma` → `@prisma/config`) zafiyetli sürümlere bağlı kalması yüzünden elle yukarı sabitlendi. Üst paketler kendi bağımlılıklarını güncelleyince bu blok kaldırılabilir; kaldırmadan önce `npm audit --omit=dev` ile doğrulayın
- **Ana sayfanın `<title>`'ı elle verilir** — projede kök `layout.tsx` yoktur; `[locale]/layout.tsx` hem `<html>`'i basar hem `title.default`/`title.template`'i tanımlar. Next bu ikisini yalnızca ALT segmentlere uygular, aynı segmentteki `[locale]/page.tsx`'e uygulamaz. Ana sayfa başlığını bu yüzden `generateMetadata` içinde açıkça verir; şablon uygulanmadığı için değer **tam başlık** olmalıdır
- **Form metinleri CRLF gelir** — `src/lib/richtext.tsx` ve server action'lar `\r\n` → `\n` normalize eder
- **`site_logo` ayarı doluysa** yerleşik `/brand/logo.png` ezilir
- **Worktree'lerin kendi `node_modules`'u yoktur** (ana depoyu paylaşırlar); Turbopack build orada kök hatası verebilir. Gerekirse worktree içinde `npm install` çalıştırın
- **Yeni bir worktree'de `.env` YOKTUR** — `.gitignore` onu dışarıda bırakır. Kopyalamadan sunucu başlatırsanız her sayfa `PrismaClientInitializationError: Environment variable not found: DATABASE_URL` ile çöker. Ana depodan kopyalayın: `cp ../../../.env .env` (gitignore'lu olduğu için commit'e girmez, silmeye de gerek yoktur)
- **`next-env.d.ts` dev ile build arasında gidip gelir** (`.next/types` ↔ `.next/dev/types`); bu değişikliği commit etmeyin
- **`Dockerfile` güncel değildir** — SQLite dönemine aittir ve her başlatmada `db push` + `seed` çalıştırır. Paylaşılan PostgreSQL ile bu yıkıcıdır; kullanmadan önce gözden geçirin. Güncel yayın yolu Vercel'dir.
