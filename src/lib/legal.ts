import type { Locale } from "./i18n";

/**
 * Legal texts (Cookie Policy + KVKK / data-protection notice) shown on their own
 * public pages and summarised in the consent bar. Bodies use the project's
 * mini-markdown so they render through the shared `ProseText` component:
 * every block is separated by a BLANK LINE, `## ` is a heading, `- ` a list,
 * `**bold**` inline.
 *
 * NOTE: These are standard, KVKK-aligned TEMPLATES. Concrete data-controller
 * details (address / e-mail / phone) are injected on the page from admin
 * Settings. Have them reviewed and adapted by your own legal counsel before
 * relying on them (e.g. VERBİS registration, specific retention periods).
 */
export type LegalDoc = { title: string; updated: string; body: string };

export const cookiePolicy: Record<Locale, LegalDoc> = {
  tr: {
    title: "Çerez Politikası",
    updated: "14 Ağustos 2026",
    body: `Bu Çerez Politikası, SAFARI CONSULTING ("Şirket") tarafından işletilen web sitesinde çerezlerin nasıl ve hangi amaçlarla kullanıldığını açıklar. Politika, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") ve Kişisel Verileri Koruma Kurumu'nun Çerez Uygulamaları Hakkında Rehberi ile uyumlu olacak şekilde hazırlanmıştır.

## Çerez nedir?

Çerezler, bir web sitesini ziyaret ettiğinizde tarayıcınıza kaydedilen küçük metin dosyalarıdır. Tercihlerinizin hatırlanmasını, sitenin güvenli ve verimli çalışmasını ve ziyaret istatistiklerinin ölçülmesini sağlarlar.

## Hangi çerezleri kullanıyoruz?

- **Zorunlu çerezler:** Sitenin temel işlevleri, güvenliği ve oturum yönetimi için gereklidir. Yasal dayanağı meşru menfaat olup açık rıza gerektirmez; bu çerezler olmadan site düzgün çalışmaz.
- **Analitik / performans çerezleri:** Ziyaretçilerin siteyi nasıl kullandığını anonim ve toplu olarak anlamamıza yardımcı olur (örneğin Google Analytics). Bu çerezler yalnızca **açık rızanızla** çalıştırılır.

## Google Analytics

İzin vermeniz hâlinde, ziyaret istatistiklerini ölçmek için Google Analytics kullanılır. Çerez bandında **"Reddet"** seçeneğini işaretlerseniz analitik çerezler hiç yüklenmez ve çalışmaz. İlgili veriler, hizmet sağlayıcının politikaları uyarınca işlenir.

## Çerezleri nasıl yönetebilirsiniz?

Site ilk açıldığında görüntülenen çerez bandından tercihinizi belirleyebilirsiniz. Seçiminizi dilediğiniz zaman sayfanın altındaki **"Çerez tercihleri"** bağlantısından değiştirebilirsiniz. Ayrıca tarayıcı ayarlarınızdan çerezleri silebilir veya engelleyebilirsiniz; zorunlu çerezleri engellemeniz hâlinde bazı bölümler çalışmayabilir.

## Saklama süresi

Çerezler, türüne bağlı olarak oturum süresince veya belirli bir süre boyunca cihazınızda saklanır. Onay tercihiniz, size tekrar sorulmaması için tarayıcınızda saklanır.

## Değişiklikler

Bu politika zaman zaman güncellenebilir. Güncel sürüm her zaman bu sayfada yayımlanır.

## İletişim

Çerezler ve kişisel verilerinizle ilgili sorularınız için aşağıdaki iletişim bilgilerinden bize ulaşabilirsiniz.`,
  },
  en: {
    title: "Cookie Policy",
    updated: "14 August 2026",
    body: `This Cookie Policy explains how and why cookies are used on the website operated by SAFARI CONSULTING (the "Company"). It has been prepared in line with Turkish Law No. 6698 on the Protection of Personal Data ("KVKK") and the guidance of the Turkish Data Protection Authority on cookie practices.

## What is a cookie?

Cookies are small text files stored in your browser when you visit a website. They let us remember your preferences, keep the site secure and efficient, and measure visit statistics.

## Which cookies do we use?

- **Strictly necessary cookies:** Required for the core functionality, security and session management of the site. Their legal basis is legitimate interest and they do not require consent; without them the site will not work properly.
- **Analytics / performance cookies:** Help us understand, anonymously and in aggregate, how visitors use the site (e.g. Google Analytics). These run **only with your explicit consent**.

## Google Analytics

If you allow it, Google Analytics is used to measure visit statistics. If you choose **"Reject"** in the cookie bar, no analytics cookies are loaded or run. The related data is processed under the service provider's policies.

## How can you manage cookies?

You can set your preference in the cookie bar shown when you first open the site. You may change your choice at any time via the **"Cookie preferences"** link in the footer. You can also delete or block cookies through your browser settings; blocking strictly necessary cookies may break some sections.

## Retention

Depending on their type, cookies are stored on your device for the session or for a defined period. Your consent choice is stored in your browser so you are not asked again.

## Changes

This policy may be updated from time to time. The current version is always published on this page.

## Contact

For any questions about cookies or your personal data, you can reach us using the contact details below.`,
  },
  ru: {
    title: "Политика использования cookie",
    updated: "14 августа 2026",
    body: `Настоящая Политика описывает, как и с какими целями используются файлы cookie на сайте, управляемом SAFARI CONSULTING («Компания»). Она подготовлена в соответствии с Законом Турции № 6698 о защите персональных данных («KVKK») и рекомендациями турецкого органа по защите данных о применении cookie.

## Что такое cookie?

Cookie — это небольшие текстовые файлы, сохраняемые в вашем браузере при посещении сайта. Они позволяют запоминать ваши настройки, обеспечивать безопасность и эффективность сайта и измерять статистику посещений.

## Какие cookie мы используем?

- **Обязательные cookie:** необходимы для основных функций, безопасности и управления сессией сайта. Их правовое основание — законный интерес, они не требуют согласия; без них сайт не работает корректно.
- **Аналитические cookie:** помогают анонимно и в совокупности понимать, как посетители используют сайт (например, Google Analytics). Они работают **только с вашего явного согласия**.

## Google Analytics

Если вы разрешите, для измерения статистики посещений используется Google Analytics. Если вы выберете **«Отклонить»** в панели cookie, аналитические cookie не загружаются и не работают. Соответствующие данные обрабатываются согласно политике поставщика услуги.

## Как управлять cookie?

Вы можете задать предпочтение в панели cookie, которая появляется при первом открытии сайта. Изменить выбор можно в любой момент по ссылке **«Настройки cookie»** в нижнем колонтитуле. Также вы можете удалить или заблокировать cookie в настройках браузера; блокировка обязательных cookie может нарушить работу некоторых разделов.

## Срок хранения

В зависимости от типа cookie хранятся на устройстве в течение сессии или определённого периода. Ваш выбор согласия сохраняется в браузере, чтобы не спрашивать повторно.

## Изменения

Политика может периодически обновляться. Актуальная версия всегда публикуется на этой странице.

## Контакты

По любым вопросам о cookie или ваших персональных данных вы можете связаться с нами по контактам ниже.`,
  },
};

export const kvkkNotice: Record<Locale, LegalDoc> = {
  tr: {
    title: "KVKK Aydınlatma Metni",
    updated: "14 Ağustos 2026",
    body: `İşbu Aydınlatma Metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun ("KVKK") 10. maddesi kapsamında, veri sorumlusu sıfatıyla SAFARI CONSULTING ("Şirket") tarafından, web sitesi ziyaretçilerinin kişisel verilerinin işlenmesine ilişkin olarak hazırlanmıştır.

## Veri sorumlusu

Kişisel verileriniz, veri sorumlusu SAFARI CONSULTING tarafından aşağıda açıklanan kapsamda işlenmektedir. Güncel iletişim bilgileri bu sayfanın sonunda yer almaktadır.

## İşlenen kişisel veriler

- **Kimlik ve iletişim bilgileri:** İletişim formu aracılığıyla ilettiğiniz ad-soyad, e-posta, telefon, şirket ve mesaj içeriği.
- **İşlem güvenliği verileri:** IP adresi, tarayıcı/cihaz bilgileri ve site kullanımına ilişkin log kayıtları.
- **Çerez verileri:** Açık rızanıza bağlı olarak toplanan analitik/performans verileri.

## İşleme amaçları

- Taleplerinizi ve başvurularınızı yanıtlamak, sizinle iletişim kurmak,
- Sunduğumuz hizmetleri tanıtmak ve iyileştirmek,
- Sitenin güvenliğini sağlamak ve kötüye kullanımı önlemek,
- İzin vermeniz hâlinde ziyaret istatistiklerini analiz etmek,
- Hukuki yükümlülüklerimizi yerine getirmek.

## Hukuki sebepler

Kişisel verileriniz, KVKK madde 5 uyarınca; bir sözleşmenin kurulması veya ifası, bir hakkın tesisi ve korunması, hukuki yükümlülüğün yerine getirilmesi ve meşru menfaat hukuki sebeplerine dayanılarak; analitik çerezler bakımından ise **açık rızanıza** dayanılarak işlenir.

## Aktarım

Kişisel verileriniz, yukarıdaki amaçlarla sınırlı olarak; hizmet aldığımız tedarikçilere (ör. barındırma, e-posta, analitik sağlayıcıları) ve yasal olarak yetkili kamu kurum ve kuruluşlarına, KVKK madde 8 ve 9'a uygun şekilde aktarılabilir.

## Haklarınız

KVKK madde 11 uyarınca; kişisel verilerinizin işlenip işlenmediğini öğrenme, buna ilişkin bilgi talep etme, işlenme amacını öğrenme, düzeltilmesini veya silinmesini isteme, işlemeye itiraz etme ve zararın giderilmesini talep etme haklarına sahipsiniz.

## Başvuru ve iletişim

Haklarınıza ilişkin taleplerinizi, aşağıdaki iletişim bilgileri üzerinden yazılı olarak Şirket'e iletebilirsiniz. Başvurularınız, talebin niteliğine göre en geç 30 gün içinde ücretsiz olarak sonuçlandırılır.`,
  },
  en: {
    title: "Data Protection Notice (KVKK)",
    updated: "14 August 2026",
    body: `This notice is prepared by SAFARI CONSULTING (the "Company") as data controller, under Article 10 of Turkish Law No. 6698 on the Protection of Personal Data ("KVKK"), regarding the processing of website visitors' personal data.

## Data controller

Your personal data is processed by the data controller SAFARI CONSULTING within the scope explained below. Current contact details are provided at the end of this page.

## Personal data processed

- **Identity and contact data:** name, e-mail, phone, company and message content you submit through the contact form.
- **Transaction-security data:** IP address, browser/device information and log records relating to site usage.
- **Cookie data:** analytics/performance data collected subject to your explicit consent.

## Purposes of processing

- To respond to your requests and applications and communicate with you,
- To present and improve the services we offer,
- To ensure the security of the site and prevent misuse,
- To analyse visit statistics where you have given consent,
- To fulfil our legal obligations.

## Legal grounds

Your personal data is processed under Article 5 of the KVKK on the grounds of the establishment or performance of a contract, the establishment and protection of a right, compliance with a legal obligation and legitimate interest; and, for analytics cookies, on the basis of your **explicit consent**.

## Transfers

Limited to the purposes above, your personal data may be transferred to our service providers (e.g. hosting, e-mail, analytics providers) and to legally authorised public institutions, in accordance with Articles 8 and 9 of the KVKK.

## Your rights

Under Article 11 of the KVKK you have the right to learn whether your personal data is processed, to request information about it, to learn the purpose of processing, to request its correction or deletion, to object to processing and to request compensation for damages.

## Applications and contact

You may submit requests regarding your rights to the Company in writing via the contact details below. Your applications are concluded free of charge within 30 days at the latest, depending on the nature of the request.`,
  },
  ru: {
    title: "Уведомление о защите данных (KVKK)",
    updated: "14 августа 2026",
    body: `Настоящее уведомление подготовлено компанией SAFARI CONSULTING («Компания») в качестве оператора данных в соответствии со статьёй 10 Закона Турции № 6698 о защите персональных данных («KVKK») в отношении обработки персональных данных посетителей сайта.

## Оператор данных

Ваши персональные данные обрабатываются оператором SAFARI CONSULTING в объёме, описанном ниже. Актуальные контактные данные приведены в конце этой страницы.

## Обрабатываемые персональные данные

- **Идентификационные и контактные данные:** имя, e-mail, телефон, компания и текст сообщения, отправленные через форму обратной связи.
- **Данные безопасности операций:** IP-адрес, сведения о браузере/устройстве и записи журналов об использовании сайта.
- **Данные cookie:** аналитические данные, собираемые при наличии вашего явного согласия.

## Цели обработки

- ответы на ваши запросы и обращения и связь с вами,
- представление и улучшение предоставляемых услуг,
- обеспечение безопасности сайта и предотвращение злоупотреблений,
- анализ статистики посещений при наличии вашего согласия,
- выполнение наших юридических обязательств.

## Правовые основания

Ваши данные обрабатываются согласно статье 5 KVKK на основаниях заключения или исполнения договора, установления и защиты права, выполнения юридического обязательства и законного интереса; а в отношении аналитических cookie — на основании вашего **явного согласия**.

## Передача данных

В пределах указанных целей ваши данные могут передаваться нашим поставщикам услуг (например, хостинг, e-mail, аналитика) и уполномоченным государственным органам в соответствии со статьями 8 и 9 KVKK.

## Ваши права

Согласно статье 11 KVKK вы имеете право узнать, обрабатываются ли ваши данные, запросить информацию о них, узнать цель обработки, потребовать их исправления или удаления, возразить против обработки и потребовать возмещения ущерба.

## Обращения и контакты

Вы можете направить обращения относительно ваших прав в письменном виде по контактным данным ниже. Обращения рассматриваются бесплатно в срок не более 30 дней в зависимости от характера запроса.`,
  },
};
