# SAFARI CONSULTING — Kurumsal Web Sitesi

Çok dilli (TR / EN / RU), yönetim panelli kurumsal tanıtım sitesi.

## Teknolojiler

- **Next.js 15** (App Router, sunucu tarafı render — SEO dostu)
- **Tailwind CSS 4** (özel marka paleti: orman yeşili, altın, fildişi)
- **Prisma + SQLite** (kurulum gerektirmez; PostgreSQL'e kolayca taşınır)
- **jose + bcryptjs** (güvenli yönetici oturumu)
- **nodemailer** (iletişim formu e-posta bildirimi)

## Çalıştırma

```bash
npm install          # bağımlılıkları yükle
npm run setup        # veritabanını oluştur ve içeriği yükle (ilk kurulumda)
npm run dev          # geliştirme sunucusu → http://localhost:3000
```

Üretim için:

```bash
npm run build
npm run start
```

## Adresler

| Adres | Açıklama |
|---|---|
| `/tr`, `/en`, `/ru` | Site (üç dil; `/` ziyaretçinin tarayıcı diline yönlendirir) |
| `/admin` | Yönetim paneli |

## Yönetim paneli

- **Giriş:** `admin@safariconsulting.com`
- **İlk şifre:** `SafariAdmin2026!` → **ilk girişte Ayarlar sayfasından değiştirin.**

Panelden yönetilebilenler: sayfa metinleri (3 dilde), 13 hizmetin içerikleri, referanslar,
iletişim talepleri (yeni/okundu/yanıtlandı), iletişim bilgileri, SMTP ayarları, şifre.

## E-posta bildirimleri

İletişim formundan gelen talepler her zaman panelde listelenir. Ayrıca e-posta bildirimi
için **Ayarlar → E-posta Bildirimleri (SMTP)** bölümünü doldurun (ör. Gmail için
`smtp.gmail.com`, port 587, uygulama şifresi).

## Ortam değişkenleri (`.env`)

| Değişken | Açıklama |
|---|---|
| `DATABASE_URL` | SQLite dosya yolu (varsayılan: `file:./safari.db`) |
| `SESSION_SECRET` | Oturum imza anahtarı — **üretimde mutlaka değiştirin** |
| `SITE_URL` | Yayın adresi (SEO etiketleri için, ör. `https://safariconsulting.com`) |

## Docker ile dağıtım

```bash
docker build -t safari-consulting .
docker run -p 3000:3000 -v safari-db:/app/prisma safari-consulting
```
