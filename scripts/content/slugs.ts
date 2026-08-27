// Dile göre URL adları (slug). Anahtar, kaydın ortak (TR) slug'ıdır.
//
// Bu dosya yalnızca ilk doldurma (backfill) içindir: apply-slugs.ts bunları
// ServiceTranslation.slug / PostTranslation.slug alanlarına yazar. Sonrasında
// kaynak veritabanıdır — yeni bir hizmet/yazının dil slug'ları panelden girilir.
//
// TR slug'ları da açıkça yazılır; böylece "boşsa ortak slug'a düş" davranışı
// yalnızca gelecekteki kayıtlar için kalır, mevcut 26 kayıt belirsizlik taşımaz.

export type SlugSet = { tr: string; en: string; ru: string };

export const serviceSlugs: Record<string, SlugSet> = {
  "mali-danismanlik": {
    tr: "mali-danismanlik",
    en: "financial-advisory",
    ru: "finansovyy-konsalting",
  },
  "yatirim-danismanligi": {
    tr: "yatirim-danismanligi",
    en: "investment-advisory",
    ru: "investitsionnyy-konsalting",
  },
  "mali-ticari-hukuk-danismanligi": {
    tr: "mali-ticari-hukuk-danismanligi",
    en: "financial-commercial-law-advisory",
    ru: "finansovoe-i-kommercheskoe-pravo",
  },
  "ticaret-is-gelistirme": {
    tr: "ticaret-is-gelistirme",
    en: "trade-business-development",
    ru: "torgovlya-i-razvitie-biznesa",
  },
  "pazar-arastirmasi-pazara-giris": {
    tr: "pazar-arastirmasi-pazara-giris",
    en: "market-research-market-entry",
    ru: "issledovanie-rynka-i-vykhod",
  },
  "sirket-kurulusu": {
    tr: "sirket-kurulusu",
    en: "company-formation",
    ru: "registratsiya-kompaniy",
  },
  "kurumsal-kimlik-marka": {
    tr: "kurumsal-kimlik-marka",
    en: "corporate-identity-brand",
    ru: "korporativnaya-identichnost-i-brend",
  },
  "proje-yonetimi": {
    tr: "proje-yonetimi",
    en: "project-management",
    ru: "upravlenie-proektami",
  },
  "uyum-denetim-danismanligi": {
    tr: "uyum-denetim-danismanligi",
    en: "compliance-audit-advisory",
    ru: "komplaens-i-audit",
  },
  "gayrimenkul-danismanligi": {
    tr: "gayrimenkul-danismanligi",
    en: "real-estate-advisory",
    ru: "konsalting-po-nedvizhimosti",
  },
  "oturma-calisma-izni-vatandaslik": {
    tr: "oturma-calisma-izni-vatandaslik",
    en: "residence-work-permits-citizenship",
    ru: "vnzh-razresheniya-i-grazhdanstvo",
  },
  "lojistik-gumruk-danismanligi": {
    tr: "lojistik-gumruk-danismanligi",
    en: "logistics-customs-advisory",
    ru: "logistika-i-tamozhennyy-konsalting",
  },
  "cozum-ortakliklari": {
    tr: "cozum-ortakliklari",
    en: "solution-partnerships",
    ru: "partnerskaya-set-resheniy",
  },
};

export const postSlugs: Record<string, SlugSet> = {
  "finansal-raporlar-size-ne-anlatiyor": {
    tr: "finansal-raporlar-size-ne-anlatiyor",
    en: "what-your-financial-reports-tell-you",
    ru: "o-chem-govoryat-finansovye-otchety",
  },
  "yatirim-kararlarinda-veri-odakli-yaklasim": {
    tr: "yatirim-kararlarinda-veri-odakli-yaklasim",
    en: "data-driven-investment-decisions",
    ru: "investitsionnye-resheniya-na-osnove-dannykh",
  },
  "ticari-sozlesmelerde-sik-yapilan-hatalar": {
    tr: "ticari-sozlesmelerde-sik-yapilan-hatalar",
    en: "common-mistakes-in-commercial-contracts",
    ru: "chastye-oshibki-v-kommercheskikh-dogovorakh",
  },
  "ihracatta-ilk-adim-pazar-secimi": {
    tr: "ihracatta-ilk-adim-pazar-secimi",
    en: "first-step-in-exporting-choosing-a-market",
    ru: "pervyy-shag-v-eksporte-vybor-rynka",
  },
  "pazara-giris-stratejisi-nereden-baslamali": {
    tr: "pazara-giris-stratejisi-nereden-baslamali",
    en: "market-entry-strategy-where-to-begin",
    ru: "strategiya-vykhoda-na-rynok-s-chego-nachat",
  },
  "sirket-yapisi-secimi-neyi-degistirir": {
    tr: "sirket-yapisi-secimi-neyi-degistirir",
    en: "what-the-choice-of-company-structure-changes",
    ru: "chto-menyaet-vybor-formy-kompanii",
  },
  "kurumsal-kimlik-logodan-ibaret-degildir": {
    tr: "kurumsal-kimlik-logodan-ibaret-degildir",
    en: "corporate-identity-is-not-a-logo",
    ru: "korporativnaya-identichnost-eto-ne-logotip",
  },
  "projeler-neden-butceyi-asar": {
    tr: "projeler-neden-butceyi-asar",
    en: "why-projects-go-over-budget",
    ru: "pochemu-proekty-vykhodyat-za-byudzhet",
  },
  "ic-kontrol-sistemi-denetimden-once": {
    tr: "ic-kontrol-sistemi-denetimden-once",
    en: "internal-controls-are-built-before-the-audit",
    ru: "vnutrenniy-kontrol-stroitsya-do-audita",
  },
  "ticari-gayrimenkulde-yatirim-analizi": {
    tr: "ticari-gayrimenkulde-yatirim-analizi",
    en: "analysing-a-commercial-real-estate-investment",
    ru: "analiz-investitsii-v-kommercheskuyu-nedvizhimost",
  },
  "yabanci-yatirimci-icin-izin-surecleri": {
    tr: "yabanci-yatirimci-icin-izin-surecleri",
    en: "permit-processes-for-foreign-investors",
    ru: "razreshitelnye-protsedury-dlya-inostrantsev",
  },
  "gumruk-gecikmelerinin-gizli-maliyeti": {
    tr: "gumruk-gecikmelerinin-gizli-maliyeti",
    en: "the-hidden-cost-of-customs-delays",
    ru: "skrytaya-stoimost-zaderzhek-na-tamozhne",
  },
  "danismanlikta-tek-nokta-yaklasimi": {
    tr: "danismanlikta-tek-nokta-yaklasimi",
    en: "why-a-single-point-of-contact-works",
    ru: "edinaya-tochka-kontakta-v-konsaltinge",
  },
};
