# SAFARI CONSULTING — Proje Devir Notu (Handoff)

> Bu dosya, sohbet geçişlerinde bağlamı korumak içindir. Yeni oturuma başlarken önce bunu oku.
> Son güncelleme: 2026-08-06

## 1. Proje nedir
Çok dilli (TR / EN / RU), sinematik/scrollytelling tasarımlı kurumsal danışmanlık web sitesi + tam kapsamlı yönetim paneli (CMS) + Blog modülü. Şirket: **SAFARI CONSULTING** (finans, yatırım, uluslararası ticaret, kurumsal danışmanlık).

- Proje kökü: `D:\PROJELER\SAFARI CONSULTING`
- Platform: Windows, PowerShell + Git Bash. Node v24, npm.
- **Canlı:** https://safari-consulting.vercel.app  ·  Panel: https://safari-consulting.vercel.app/admin

## 2. Teknoloji
- **Next.js 16** (App Router, RSC, server actions; Turbopack varsayılan build) + **React 19.2** + **TypeScript** + **Tailwind CSS 4**
- **Prisma + PostgreSQL** (Prisma Postgres bulutu — hem yerel hem canlı AYNI DB'yi kullanır)
- Kimlik: **jose** (JWT çerez) + **bcryptjs** + **2FA/TOTP** (`otpauth` + `qrcode`)
- E-posta: **nodemailer** (SMTP, panelden ayarlanır; şifre AES-256-GCM ile şifreli saklanır)
- Dosya yükleme: **@vercel/blob** (PUBLIC store)
- Animasyon: **lenis** (yumuşak scroll) + saf rAF (framer-motion/GSAP YOK — kaldırıldı)

## 3. Dağıtım / ortam
- Vercel projesi: `vozas-projects/safari-consulting` (hesap: vozaprime). `npx vercel deploy --prod --yes` ile dağıt.
- Vercel env (production): `DATABASE_URL`, `SESSION_SECRET`, `SITE_URL`, `BLOB_READ_WRITE_TOKEN` (+ BLOB_STORE_ID vs. — Blob store PUBLIC).
- `.env` (yerel) `DATABASE_URL` ve `SESSION_SECRET` içerir; `.vercelignore` scripts/, .env vb. hariç tutar.
- **Build komutu:** `prisma generate && next build`. Şema değişince `npx prisma db push` + `npx prisma generate`.

## 4. Panel giriş
- URL: `/admin`  ·  E-posta: `admin@safariconsulting.com`  ·  Şifre: `SafariAdmin2026!`
- Roller: **admin** (her şey) / **editor** (ayarlar, kullanıcılar, aktivite HARİÇ).

## 5. Veri modeli (prisma/schema.prisma)
`User` (role, tokenVersion, resetToken, **twoFactorEnabled/twoFactorSecret(şifreli)/twoFactorBackupCodes(hash'li)**), `Service`+`ServiceTranslation` (13 hizmet, 3 dil, image), `Reference` (logo), `PageContent` (key+locale), `ContactMessage` (ip, notes, status), `Setting` (key/value), `AuditLog`, `LoginAttempt`, `Post`+`PostTranslation` (blog, 3 dil, cover, published).

## 6. Tamamlanan işler (kronolojik özet)
1. Site iskeleti + 13 hizmetin TR/EN/RU tohum içeriği.
2. Vitrin: ana sayfa, hakkımızda, hizmetler(+detay), referanslar, iletişim. Palet: orman yeşili/altın/fildişi, serif başlık (Playfair) + Inter.
3. **Higgsfield MCP** ile üretilen 3 hero videosu + ~20 marka görseli (zümrüt/altın). MCP kuruldu, OAuth ile bağlandı (Plus plan). Not: günlük görsel üretim limiti var.
4. **Scrollytelling ana sayfa**: StoryHero (scroll ile video scrub — `video.currentTime` scroll'a bağlı, loop DEĞİL), ProcessStory (4 bölüm pinned, cross-fade), ServiceUniverse (4 kategori pinned), ServiceIndex (editoryal indeks, hover'da imleci takip eden görsel), cam kartlı "Neden Biz", pusula rozeti sayaçlar (StatRing), kayan referans logoları (marquee).
5. Hizmet detayları **dergisel makale** (ArticleBody): drop-cap, altın çizgili `## başlık`, `> alıntı` bloğu, makale-içi görsel. İçerik 13 hizmet × 3 dil, her biri 600+ kelime (paralel ajanlarla yazıldı).
6. Sayfa header'larına konuya özel PageHero görselleri.
7. **Zengin metin editörü** (RichTextEditor): araç çubuğu (kalın/italik/başlık/alıntı/liste) + canlı önizleme. Format: mini-markdown (`## `, `> `, `**`, `- `). Paylaşılan render katmanı: `src/lib/richtext.tsx` (`parseBlocks`, `renderInline`, `ProseText`). ArticleBody + tüm içerik alanları bunu kullanır.
8. **Yönetim paneli (P1+P2+P3):** ikonlu/aktif kenar çubuğu + mobil çekmece, toast bildirimleri, silme onayları, pending butonlar; Blob dosya yükleme; talep yönetimi (arama/sayfalama/detay/not/CSV/toplu/mailto); hizmet ekle/sil/sırala/görsel; içerik dil sekmeli editör; dashboard grafikleri; güvenlik (rate limit, çoklu kullanıcı/roller, e-posta ile şifre sıfırlama, tokenVersion "tüm oturumları kapat", audit log, SMTP şifreleme).
9. **Eksik/yarım özellikler tamamlandı:** ölü ayarlar siteye bağlandı (SEO/GA/logo/favicon/sosyal), iletişim formu spam koruması (honeypot + süre + IP limiti), sitemap.xml + robots.txt, **Blog modülü** (admin + public + nav), **medya kütüphanesi** (`/admin/media`).
10. **2FA (TOTP) eklendi (2026-08-06):** `otpauth` + `qrcode`. Ayarlar'da kurulum (QR + tek seferlik yedek kodlar), girişte `/admin/2fa` challenge (TOTP veya yedek kod), Kullanıcılar sayfasında admin "2FA sıfırla" kurtarma. Şifreli secret (`crypto.ts` AES-GCM), sha256 hash'li yedek kodlar, kısa ömürlü `sc_2fa` pending çerezi. **Uçtan uca test edildi** (tek kullanımlık test hesabıyla; hesap+kayıtlar sonra temizlendi). Gerçek admin 2FA'sı KAPALI bırakıldı. **Canlıya deploy edildi (2026-08-06).**
11. **Git deposu kuruldu (2026-08-06):** `git init` (main), ilk commit + 2FA commit'i. `.gitignore` sırları ve büyük medyayı (`*.m4a` vb.) hariç tutar. Not: proje uzak (remote) repoya bağlı DEĞİL.
12. **Güvenlik yükseltmesi (2026-08-06):** `npm audit`'teki 4 high açık kapatıldı → **0 açık**. İki commit: **nodemailer 7→9.0.4** (+@types 6→8; SMTP/CRLF enjeksiyonu) ve **Next.js 15→16.3.0** (+ react/react-dom 19.1→19.2.8; Next'in 8 açığı + bağımlı savunmasız postcss & sharp). Next 15.x hattında yama yoktu; tek çözüm Next 16 majör yükseltmesiydi. Kod uyumluydu: `params`/`searchParams`/`cookies()`/`headers()` zaten async, `next/image` hiç kullanılmıyor. Tek bilinçli davranış koruması: `<html>`'e `data-scroll-behavior="smooth"` (Next 16 SPA gezinmede scroll-behavior'ı ezmiyor; Lenis ile birlikte eski "anında yukarı" davranışı korundu). Turbopack artık varsayılan build. Doğrulandı: build başarılı + 3 dilde (tr/en/ru) 13 rota HTTP 200 + middleware admin kapısı (`/`→`/tr`, `/admin`→`/admin/login`) + sunucu/konsol hatasız. **main'e merge edildi (fast-forward).** Bağlı Next 16 temizlikleri aynı gün yapıldı: (a) `middleware.ts` → **`proxy.ts`** (fonksiyon `proxy`; deprecation giderildi, runtime edge→nodejs; §7); (b) `next lint` → **ESLint flat config** (`eslint`+`eslint-config-next`+`eslint.config.mjs`, `"lint":"eslint"`). `npm run lint` çalışıyor ama mevcut kodda 12 error/3 warning react-hooks bulgusu var (yeni katı kurallar; `next build` lint çalıştırmadığı için deploy'u etkilemez — henüz DÜZELTİLMEDİ). **Canlıya deploy `npx vercel deploy --prod --yes` ile YAPILACAK** (DB şeması değişmedi; deploy öncesi iletişim formu maili + scrollytelling'i tarayıcıda gözden geçir).

## 7. ÖNEMLİ teknik notlar / tuzaklar
- **CRLF hatası (çözüldü):** Tarayıcı formları uzun metni `\r\n` ile gönderir; `parseBlocks` ve server action'lar artık `\r\n?` → `\n` normalize eder. Yeni metin render bileşeni yazarken paylaşılan `parseBlocks` kullan.
- **force-dynamic:** DB-içerikli tüm public sayfalar (`[locale]/page`, about, services, services/[slug], references, contact, blog, blog/[slug]) `export const dynamic = "force-dynamic"` — panel değişiklikleri anında yansısın diye. Yeni içerik sayfası eklerken bunu ekle.
- **Blob store PUBLIC olmalı** (private store `access:"public"` ile hata verir). Yükleme yoksa Uploader "URL yapıştır" ile de çalışır.
- **Aynı DB:** Yerel `npm run dev`/`start` ve canlı AYNI Postgres'i kullanır — yereldeki panel değişikliği canlıyı etkiler.
- **In-app tarayıcı gezinme takıntısı:** `navigate` bazen ana sayfaya düşüyor; login için `form.requestSubmit()` veya JS ile submit daha güvenilir. Aynı quirk server-action redirect sonrası da URL'i stale gösterebilir — gerçek durumu doğrulamak için hedef sayfaya (`/admin`) elle git.
- **2FA & proxy (eski adıyla middleware):** `src/proxy.ts` (Next 16'da `middleware.ts`'ten yeniden adlandırıldı; export `proxy`, artık **nodejs** runtime) `/admin/*` altında geçerli `sc_session` ister. `/admin/2fa` challenge sayfası TAM oturum yokken çalıştığından `publicAdmin` istisnasındadır (kendi pending-`sc_2fa` çerez guard'ı var). Yeni bir oturum-öncesi admin rotası eklersen bu istisnaya da ekle. `config.matcher` aynı kaldı.

## 8. Bilinen açık / opsiyonel işler (yapılmadı)
- Makale-içi görseller: Higgsfield günlük limiti nedeniyle bazı hizmet makalelerinde konuya en yakın MEVCUT görseller eşleştirildi; limit yenilenince birebir özel görseller üretilebilir.
- Gerçek iletişim bilgileri/telefon/adres hâlâ yer tutucu olabilir — panel > Ayarlar'dan güncellenmeli.
- SMTP boş olabilir; doldurulunca e-posta bildirimi + şifre sıfırlama e-postaları aktifleşir.
- İlk şifre değiştirilmeli (canlı, herkese açık).

## 9. Yerel çalıştırma
```bash
npm install
npm run build   # prisma generate + next build
npm run start   # veya: preview_start (name: "safari-consulting")
```
Doğrulama tercihen tarayıcı MCP'si (Claude_Browser preview_start `name: safari-consulting`) ile. Build sırasında dev sunucusu Prisma DLL'ini kilitleyebilir → önce node süreçlerini kapat.
