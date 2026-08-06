import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type L = { title: string; summary: string; description: string; scope: string[] };
type ServiceSeed = { slug: string; icon: string; tr: L; en: L; ru: L };

const services: ServiceSeed[] = [
  {
    slug: "mali-danismanlik",
    icon: "finance",
    tr: {
      title: "Mali Danışmanlık",
      summary: "Finansal analiz, bütçeleme, vergi ve risk yönetimiyle mali yapınızı güçlendiriyoruz.",
      description:
        "İşletmelerin finansal yapılarını güçlendirmek, sürdürülebilir büyümelerini desteklemek ve mali risklerini etkin şekilde yönetmelerini sağlamak amacıyla kapsamlı mali danışmanlık hizmetleri sunuyoruz.\n\nFinansal analiz, bütçeleme, nakit akışı yönetimi, mali planlama, vergi danışmanlığı, risk yönetimi ve finansal performans iyileştirme konularında işletmelere stratejik çözümler geliştiriyoruz.",
      scope: ["Finansal analiz ve raporlama", "Bütçeleme ve nakit akışı yönetimi", "Mali planlama", "Vergi danışmanlığı", "Risk yönetimi", "Finansal performans iyileştirme"],
    },
    en: {
      title: "Financial Advisory",
      summary: "We strengthen your financial structure through analysis, budgeting, tax and risk management.",
      description:
        "We provide comprehensive financial advisory services designed to strengthen the financial structure of businesses, support their sustainable growth and enable them to manage financial risks effectively.\n\nWe develop strategic solutions in financial analysis, budgeting, cash flow management, financial planning, tax advisory, risk management and financial performance improvement.",
      scope: ["Financial analysis and reporting", "Budgeting and cash flow management", "Financial planning", "Tax advisory", "Risk management", "Financial performance improvement"],
    },
    ru: {
      title: "Финансовый консалтинг",
      summary: "Укрепляем вашу финансовую структуру: анализ, бюджетирование, налоги и управление рисками.",
      description:
        "Мы предоставляем комплексные услуги финансового консалтинга, направленные на укрепление финансовой структуры компаний, поддержку их устойчивого роста и эффективное управление финансовыми рисками.\n\nМы разрабатываем стратегические решения в области финансового анализа, бюджетирования, управления денежными потоками, финансового планирования, налогового консультирования, управления рисками и повышения финансовой эффективности.",
      scope: ["Финансовый анализ и отчётность", "Бюджетирование и управление денежными потоками", "Финансовое планирование", "Налоговое консультирование", "Управление рисками", "Повышение финансовой эффективности"],
    },
  },
  {
    slug: "yatirim-danismanligi",
    icon: "investment",
    tr: {
      title: "Yatırım Danışmanlığı",
      summary: "Fizibilite analizleri ve yatırım planlamasıyla doğru yatırım kararları için rehberlik ediyoruz.",
      description:
        "Yatırımcıların ve işletmelerin doğru yatırım kararları alabilmeleri için fizibilite analizleri, yatırım planlaması, proje değerlendirmeleri ve yatırım süreçlerinin yönetimi alanlarında profesyonel danışmanlık hizmeti sunuyoruz.\n\nAmacımız, yatırım fırsatlarını doğru analiz ederek sürdürülebilir değer oluşturmaktır.",
      scope: ["Fizibilite analizleri", "Yatırım planlaması", "Proje değerlendirmeleri", "Yatırım süreçlerinin yönetimi", "Yatırım fırsatı analizi"],
    },
    en: {
      title: "Investment Advisory",
      summary: "Guiding sound investment decisions through feasibility studies and investment planning.",
      description:
        "We provide professional advisory services in feasibility studies, investment planning, project evaluation and investment process management, enabling investors and businesses to make sound investment decisions.\n\nOur goal is to create sustainable value by accurately analysing investment opportunities.",
      scope: ["Feasibility studies", "Investment planning", "Project evaluation", "Investment process management", "Investment opportunity analysis"],
    },
    ru: {
      title: "Инвестиционный консалтинг",
      summary: "Помогаем принимать верные инвестиционные решения: ТЭО и инвестиционное планирование.",
      description:
        "Мы предоставляем профессиональные консультационные услуги в области технико-экономических обоснований, инвестиционного планирования, оценки проектов и управления инвестиционными процессами, помогая инвесторам и компаниям принимать верные инвестиционные решения.\n\nНаша цель — создавать устойчивую ценность посредством точного анализа инвестиционных возможностей.",
      scope: ["Технико-экономические обоснования", "Инвестиционное планирование", "Оценка проектов", "Управление инвестиционными процессами", "Анализ инвестиционных возможностей"],
    },
  },
  {
    slug: "mali-ticari-hukuk-danismanligi",
    icon: "law",
    tr: {
      title: "Mali ve Ticari Hukuk Danışmanlığı",
      summary: "Sözleşmelerden ticari uyuşmazlıklara, mevzuata tam uyum için hukuki destek sağlıyoruz.",
      description:
        "Şirketlerin mali ve ticari faaliyetlerini yürürlükteki mevzuata uygun şekilde sürdürebilmeleri için hukuki süreçlerde danışmanlık sağlıyoruz.\n\nSözleşme yönetimi, ticari uyuşmazlıklar, şirketler hukuku ve ticari faaliyetlere ilişkin hukuki süreçlerde uzman çözüm ortaklarımızla kapsamlı destek sunuyoruz.",
      scope: ["Sözleşme yönetimi", "Ticari uyuşmazlıklar", "Şirketler hukuku", "Mevzuata uyum", "Hukuki süreç yönetimi"],
    },
    en: {
      title: "Financial & Commercial Law Advisory",
      summary: "Legal support for full regulatory compliance — from contracts to commercial disputes.",
      description:
        "We provide advisory support in legal processes so that companies can conduct their financial and commercial activities in full compliance with applicable legislation.\n\nTogether with our expert solution partners, we offer comprehensive support in contract management, commercial disputes, corporate law and legal processes related to commercial activities.",
      scope: ["Contract management", "Commercial disputes", "Corporate law", "Regulatory compliance", "Legal process management"],
    },
    ru: {
      title: "Финансово-коммерческое право",
      summary: "Юридическая поддержка: от договоров до коммерческих споров и соответствия законодательству.",
      description:
        "Мы консультируем компании по юридическим вопросам, позволяя им вести финансовую и коммерческую деятельность в полном соответствии с действующим законодательством.\n\nСовместно с нашими экспертными партнёрами мы оказываем комплексную поддержку в управлении договорами, коммерческих спорах, корпоративном праве и юридических процессах, связанных с коммерческой деятельностью.",
      scope: ["Управление договорами", "Коммерческие споры", "Корпоративное право", "Соответствие законодательству", "Сопровождение юридических процессов"],
    },
  },
  {
    slug: "ticaret-is-gelistirme",
    icon: "trade",
    tr: {
      title: "Ticaret ve İş Geliştirme Danışmanlığı",
      summary: "Stratejik planlama ve uluslararası iş bağlantılarıyla rekabet gücünüzü artırıyoruz.",
      description:
        "İşletmelerin yerel ve uluslararası pazarlarda rekabet gücünü artırmak amacıyla stratejik planlama, iş geliştirme, pazar analizi, ihracat–ithalat danışmanlığı, ticari süreç yönetimi ve uluslararası iş bağlantılarının geliştirilmesi konularında profesyonel destek sağlıyoruz.",
      scope: ["Stratejik planlama", "İş geliştirme", "Pazar analizi", "İhracat–ithalat danışmanlığı", "Ticari süreç yönetimi", "Uluslararası iş bağlantıları"],
    },
    en: {
      title: "Trade & Business Development",
      summary: "Boosting your competitiveness through strategic planning and international business networks.",
      description:
        "We provide professional support in strategic planning, business development, market analysis, export–import advisory, commercial process management and the development of international business connections, helping businesses increase their competitiveness in local and international markets.",
      scope: ["Strategic planning", "Business development", "Market analysis", "Export–import advisory", "Commercial process management", "International business connections"],
    },
    ru: {
      title: "Торговля и развитие бизнеса",
      summary: "Повышаем вашу конкурентоспособность: стратегическое планирование и международные связи.",
      description:
        "Мы оказываем профессиональную поддержку в стратегическом планировании, развитии бизнеса, анализе рынка, консультировании по экспорту и импорту, управлении коммерческими процессами и развитии международных деловых связей, помогая компаниям повышать конкурентоспособность на локальных и международных рынках.",
      scope: ["Стратегическое планирование", "Развитие бизнеса", "Анализ рынка", "Экспортно-импортный консалтинг", "Управление коммерческими процессами", "Международные деловые связи"],
    },
  },
  {
    slug: "pazar-arastirmasi-pazara-giris",
    icon: "market",
    tr: {
      title: "Pazar Araştırması ve Pazara Giriş Stratejileri",
      summary: "Sektör analizi ve hedef pazar belirlemeyle yeni pazarlara güvenle açılın.",
      description:
        "Yeni pazarlara açılmak isteyen şirketlere sektör analizi, rekabet değerlendirmesi, hedef pazar belirleme ve pazara giriş stratejileri geliştirerek büyüme süreçlerinde yol gösteriyoruz.",
      scope: ["Sektör analizi", "Rekabet değerlendirmesi", "Hedef pazar belirleme", "Pazara giriş stratejileri", "Büyüme yol haritası"],
    },
    en: {
      title: "Market Research & Market Entry Strategies",
      summary: "Enter new markets with confidence through sector analysis and target market identification.",
      description:
        "We guide companies seeking to expand into new markets through their growth journey by delivering sector analysis, competitive assessment, target market identification and market entry strategies.",
      scope: ["Sector analysis", "Competitive assessment", "Target market identification", "Market entry strategies", "Growth roadmap"],
    },
    ru: {
      title: "Исследование рынка и стратегии выхода",
      summary: "Уверенный выход на новые рынки: отраслевой анализ и определение целевых рынков.",
      description:
        "Мы сопровождаем компании, стремящиеся выйти на новые рынки, на всём пути их роста: проводим отраслевой анализ, оценку конкурентной среды, определяем целевые рынки и разрабатываем стратегии выхода на рынок.",
      scope: ["Отраслевой анализ", "Оценка конкурентной среды", "Определение целевых рынков", "Стратегии выхода на рынок", "Дорожная карта роста"],
    },
  },
  {
    slug: "sirket-kurulusu",
    icon: "company",
    tr: {
      title: "Yurt İçi ve Yurt Dışı Şirket Kuruluşu",
      summary: "Türkiye'de ve yurt dışında şirket kuruluşunu uçtan uca yönetiyoruz.",
      description:
        "Türkiye'de ve yurt dışında şirket kuruluşu, şirket yapılandırması, resmi izin süreçleri, lisans başvuruları ve operasyonel organizasyon konularında uçtan uca danışmanlık hizmeti sunuyoruz.",
      scope: ["Şirket kuruluşu (yurt içi / yurt dışı)", "Şirket yapılandırması", "Resmi izin süreçleri", "Lisans başvuruları", "Operasyonel organizasyon"],
    },
    en: {
      title: "Company Formation in Türkiye & Abroad",
      summary: "End-to-end management of company incorporation in Türkiye and abroad.",
      description:
        "We provide end-to-end advisory services covering company formation in Türkiye and abroad, corporate structuring, official permit processes, licence applications and operational organisation.",
      scope: ["Company incorporation (domestic / international)", "Corporate structuring", "Official permit processes", "Licence applications", "Operational organisation"],
    },
    ru: {
      title: "Регистрация компаний в Турции и за рубежом",
      summary: "Полное сопровождение регистрации компаний в Турции и за рубежом.",
      description:
        "Мы предоставляем комплексные консультационные услуги «под ключ»: регистрация компаний в Турции и за рубежом, корпоративное структурирование, получение официальных разрешений, лицензионные заявки и операционная организация.",
      scope: ["Регистрация компаний (в Турции / за рубежом)", "Корпоративное структурирование", "Официальные разрешительные процедуры", "Лицензионные заявки", "Операционная организация"],
    },
  },
  {
    slug: "kurumsal-kimlik-marka",
    icon: "brand",
    tr: {
      title: "Kurumsal Kimlik ve Marka Danışmanlığı",
      summary: "Marka konumlandırma ve kurumsal iletişimle güçlü bir kurumsal yapı inşa edin.",
      description:
        "Şirketlerin güçlü ve sürdürülebilir bir kurumsal yapı oluşturabilmeleri amacıyla kurumsal kimlik geliştirme, marka konumlandırma ve kurumsal iletişim süreçlerinde stratejik danışmanlık sağlıyoruz.",
      scope: ["Kurumsal kimlik geliştirme", "Marka konumlandırma", "Kurumsal iletişim stratejisi", "Marka mimarisi"],
    },
    en: {
      title: "Corporate Identity & Brand Advisory",
      summary: "Build a strong corporate structure through brand positioning and corporate communication.",
      description:
        "We provide strategic advisory in corporate identity development, brand positioning and corporate communication processes, enabling companies to build a strong and sustainable corporate structure.",
      scope: ["Corporate identity development", "Brand positioning", "Corporate communication strategy", "Brand architecture"],
    },
    ru: {
      title: "Корпоративная идентичность и бренд",
      summary: "Сильная корпоративная структура: позиционирование бренда и корпоративные коммуникации.",
      description:
        "Мы предоставляем стратегический консалтинг в области развития корпоративной идентичности, позиционирования бренда и корпоративных коммуникаций, помогая компаниям выстраивать сильную и устойчивую корпоративную структуру.",
      scope: ["Развитие корпоративной идентичности", "Позиционирование бренда", "Стратегия корпоративных коммуникаций", "Архитектура бренда"],
    },
  },
  {
    slug: "proje-yonetimi",
    icon: "project",
    tr: {
      title: "Proje Yönetimi",
      summary: "Projelerinizi uluslararası standartlarda, zamanında ve bütçesinde yönetiyoruz.",
      description:
        "Yatırım ve kurumsal projelerin planlanması, koordinasyonu, uygulanması ve performans takibi süreçlerini uluslararası proje yönetimi standartlarına uygun şekilde yönetiyor; projelerin zamanında ve hedeflenen bütçe içerisinde tamamlanmasını destekliyoruz.",
      scope: ["Proje planlama", "Koordinasyon ve uygulama", "Performans takibi", "Bütçe ve zaman yönetimi", "Uluslararası standartlarda raporlama"],
    },
    en: {
      title: "Project Management",
      summary: "Managing your projects to international standards — on time and on budget.",
      description:
        "We manage the planning, coordination, execution and performance monitoring of investment and corporate projects in line with international project management standards, supporting on-time completion within the targeted budget.",
      scope: ["Project planning", "Coordination and execution", "Performance monitoring", "Budget and schedule management", "Reporting to international standards"],
    },
    ru: {
      title: "Управление проектами",
      summary: "Управляем проектами по международным стандартам — в срок и в рамках бюджета.",
      description:
        "Мы управляем планированием, координацией, реализацией и мониторингом эффективности инвестиционных и корпоративных проектов в соответствии с международными стандартами проектного управления, обеспечивая завершение проектов в срок и в рамках целевого бюджета.",
      scope: ["Планирование проектов", "Координация и реализация", "Мониторинг эффективности", "Управление бюджетом и сроками", "Отчётность по международным стандартам"],
    },
  },
  {
    slug: "uyum-denetim-danismanligi",
    icon: "compliance",
    tr: {
      title: "Uyum (Compliance) ve Denetim Danışmanlığı",
      summary: "İç kontrol sistemleri ve denetim hazırlıklarıyla mevzuata tam uyum sağlayın.",
      description:
        "Şirketlerin ulusal ve uluslararası mevzuata uyum sağlamaları için iç kontrol sistemleri, kurumsal uyum süreçleri, risk değerlendirmeleri ve denetim hazırlıkları konusunda profesyonel danışmanlık hizmeti sunuyoruz.",
      scope: ["İç kontrol sistemleri", "Kurumsal uyum süreçleri", "Risk değerlendirmeleri", "Denetim hazırlıkları", "Ulusal ve uluslararası mevzuat uyumu"],
    },
    en: {
      title: "Compliance & Audit Advisory",
      summary: "Achieve full regulatory compliance through internal control systems and audit readiness.",
      description:
        "We provide professional advisory services in internal control systems, corporate compliance processes, risk assessments and audit preparation, helping companies comply with national and international legislation.",
      scope: ["Internal control systems", "Corporate compliance processes", "Risk assessments", "Audit readiness", "National and international regulatory compliance"],
    },
    ru: {
      title: "Комплаенс и аудит",
      summary: "Полное соответствие требованиям: системы внутреннего контроля и подготовка к аудиту.",
      description:
        "Мы предоставляем профессиональные консультационные услуги по системам внутреннего контроля, процессам корпоративного комплаенса, оценке рисков и подготовке к аудиту, помогая компаниям соответствовать национальному и международному законодательству.",
      scope: ["Системы внутреннего контроля", "Процессы корпоративного комплаенса", "Оценка рисков", "Подготовка к аудиту", "Соответствие национальным и международным нормам"],
    },
  },
  {
    slug: "gayrimenkul-danismanligi",
    icon: "realestate",
    tr: {
      title: "Gayrimenkul Danışmanlığı",
      summary: "Ticari ve bireysel gayrimenkul yatırımlarında analizden portföy yönetimine tam destek.",
      description:
        "Ticari ve bireysel gayrimenkul yatırımlarında yatırım analizi, satın alma, satış, değerleme, portföy yönetimi ve yatırım planlaması alanlarında profesyonel danışmanlık sağlıyoruz.",
      scope: ["Yatırım analizi", "Satın alma ve satış süreçleri", "Değerleme", "Portföy yönetimi", "Yatırım planlaması"],
    },
    en: {
      title: "Real Estate Advisory",
      summary: "Full support for commercial and private real estate — from analysis to portfolio management.",
      description:
        "We provide professional advisory in investment analysis, acquisition, sale, valuation, portfolio management and investment planning for commercial and private real estate investments.",
      scope: ["Investment analysis", "Acquisition and sale processes", "Valuation", "Portfolio management", "Investment planning"],
    },
    ru: {
      title: "Консалтинг в сфере недвижимости",
      summary: "Коммерческая и частная недвижимость: от анализа до управления портфелем.",
      description:
        "Мы предоставляем профессиональные консультации по инвестиционному анализу, покупке, продаже, оценке, управлению портфелем и инвестиционному планированию в сфере коммерческой и частной недвижимости.",
      scope: ["Инвестиционный анализ", "Сопровождение покупки и продажи", "Оценка недвижимости", "Управление портфелем", "Инвестиционное планирование"],
    },
  },
  {
    slug: "oturma-calisma-izni-vatandaslik",
    icon: "citizenship",
    tr: {
      title: "Oturma, Çalışma İzinleri ve Vatandaşlık İşlemleri",
      summary: "Yabancı yatırımcılar için oturma, çalışma izni ve vatandaşlık süreçlerini yönetiyoruz.",
      description:
        "Yabancı yatırımcılar, girişimciler ve bireyler için oturma izni, çalışma izni, yatırımcı oturumu, şirket sahibi oturumu ve vatandaşlık başvurularının tüm aşamalarını güvenilir ve profesyonel şekilde yönetiyoruz.",
      scope: ["Oturma izni", "Çalışma izni", "Yatırımcı oturumu", "Şirket sahibi oturumu", "Vatandaşlık başvuruları"],
    },
    en: {
      title: "Residence, Work Permits & Citizenship",
      summary: "Managing residence, work permit and citizenship processes for foreign investors.",
      description:
        "We reliably and professionally manage every stage of residence permit, work permit, investor residence, business-owner residence and citizenship applications for foreign investors, entrepreneurs and individuals.",
      scope: ["Residence permits", "Work permits", "Investor residence", "Business-owner residence", "Citizenship applications"],
    },
    ru: {
      title: "ВНЖ, разрешения на работу и гражданство",
      summary: "Сопровождаем получение ВНЖ, разрешений на работу и гражданства для иностранных инвесторов.",
      description:
        "Мы надёжно и профессионально сопровождаем все этапы оформления вида на жительство, разрешения на работу, ВНЖ инвестора, ВНЖ владельца компании и заявлений на гражданство для иностранных инвесторов, предпринимателей и частных лиц.",
      scope: ["Вид на жительство", "Разрешения на работу", "ВНЖ инвестора", "ВНЖ владельца компании", "Заявления на гражданство"],
    },
  },
  {
    slug: "lojistik-gumruk-danismanligi",
    icon: "logistics",
    tr: {
      title: "Lojistik ve Gümrük Danışmanlığı",
      summary: "Tedarik zinciri, ithalat-ihracat ve gümrük süreçlerinde etkin yönetim.",
      description:
        "Uluslararası ticaret süreçlerinde lojistik planlama, tedarik zinciri yönetimi, ithalat ve ihracat operasyonları, gümrük mevzuatı ve dış ticaret süreçlerinin etkin şekilde yürütülmesi için danışmanlık hizmeti veriyoruz.",
      scope: ["Lojistik planlama", "Tedarik zinciri yönetimi", "İthalat ve ihracat operasyonları", "Gümrük mevzuatı", "Dış ticaret süreçleri"],
    },
    en: {
      title: "Logistics & Customs Advisory",
      summary: "Effective management of supply chain, import-export and customs processes.",
      description:
        "We provide advisory services for the effective execution of logistics planning, supply chain management, import and export operations, customs legislation and foreign trade processes in international trade.",
      scope: ["Logistics planning", "Supply chain management", "Import and export operations", "Customs legislation", "Foreign trade processes"],
    },
    ru: {
      title: "Логистика и таможенный консалтинг",
      summary: "Эффективное управление цепями поставок, импортом-экспортом и таможенными процессами.",
      description:
        "Мы консультируем по вопросам логистического планирования, управления цепями поставок, импортных и экспортных операций, таможенного законодательства и эффективного ведения внешнеторговых процессов в международной торговле.",
      scope: ["Логистическое планирование", "Управление цепями поставок", "Импортные и экспортные операции", "Таможенное законодательство", "Внешнеторговые процессы"],
    },
  },
  {
    slug: "cozum-ortakliklari",
    icon: "partnership",
    tr: {
      title: "Çözüm Ortaklıkları",
      summary: "Hukuk, finans, teknoloji ve lojistikte güvenilir iş ortaklarımızla tek noktadan hizmet.",
      description:
        "Müşterilerimize ihtiyaç duydukları her alanda kapsamlı çözümler sunabilmek amacıyla hukuk, finans, teknoloji, mühendislik, gayrimenkul ve uluslararası ticaret gibi farklı sektörlerde faaliyet gösteren güvenilir iş ortaklarımızla birlikte çalışıyoruz.\n\nGüçlü çözüm ortaklığı ağımız sayesinde tek noktadan profesyonel ve sürdürülebilir danışmanlık hizmeti sunuyoruz.",
      scope: ["Hukuk", "Finans", "Teknoloji", "Mühendislik", "Gayrimenkul", "Uluslararası ticaret"],
    },
    en: {
      title: "Solution Partnerships",
      summary: "Single-point service with trusted partners in law, finance, technology and logistics.",
      description:
        "To deliver comprehensive solutions in every area our clients need, we work with trusted business partners operating across sectors such as law, finance, technology, engineering, real estate and international trade.\n\nThanks to our strong solution partnership network, we deliver professional and sustainable advisory services from a single point of contact.",
      scope: ["Law", "Finance", "Technology", "Engineering", "Real estate", "International trade"],
    },
    ru: {
      title: "Партнёрская сеть решений",
      summary: "Единая точка обслуживания с надёжными партнёрами в праве, финансах, технологиях и логистике.",
      description:
        "Чтобы предлагать нашим клиентам комплексные решения в любой необходимой области, мы работаем с надёжными деловыми партнёрами из различных секторов: право, финансы, технологии, инжиниринг, недвижимость и международная торговля.\n\nБлагодаря сильной партнёрской сети мы предоставляем профессиональные и устойчивые консультационные услуги по принципу «единого окна».",
      scope: ["Право", "Финансы", "Технологии", "Инжиниринг", "Недвижимость", "Международная торговля"],
    },
  },
];

const pageContent: Record<string, Record<string, string>> = {
  hero_kicker: {
    tr: "FİNANS · YATIRIM · ULUSLARARASI TİCARET · KURUMSAL DANIŞMANLIK",
    en: "FINANCE · INVESTMENT · INTERNATIONAL TRADE · CORPORATE ADVISORY",
    ru: "ФИНАНСЫ · ИНВЕСТИЦИИ · МЕЖДУНАРОДНАЯ ТОРГОВЛЯ · КОРПОРАТИВНЫЙ КОНСАЛТИНГ",
  },
  hero_title: {
    tr: "Büyüme yolculuğunuzda stratejik rehberiniz",
    en: "Your strategic guide on the journey of growth",
    ru: "Ваш стратегический проводник на пути роста",
  },
  hero_subtitle: {
    tr: "Yerel ve uluslararası pazarlarda edindiğimiz bilgi birikimi ve deneyimle; şirketlere, yatırımcılara ve girişimcilere ihtiyaçlarına özel, stratejik ve sonuç odaklı çözümler sunuyoruz.",
    en: "Drawing on our knowledge and experience in local and international markets, we deliver tailored, strategic and result-oriented solutions to companies, investors and entrepreneurs.",
    ru: "Опираясь на знания и опыт, накопленные на локальных и международных рынках, мы предлагаем компаниям, инвесторам и предпринимателям индивидуальные, стратегические и ориентированные на результат решения.",
  },
  why_title: {
    tr: "Neden SAFARI CONSULTING?",
    en: "Why SAFARI CONSULTING?",
    ru: "Почему SAFARI CONSULTING?",
  },
  why_body: {
    tr: "Her işletmenin hedefleri, faaliyet gösterdiği sektör ve büyüme stratejisi farklıdır. Bu nedenle standart çözümler yerine, müşterilerimizin ihtiyaçlarına özel analizler yapıyor, uygulanabilir stratejiler geliştiriyor ve uzun vadeli değer yaratan danışmanlık hizmetleri sunuyoruz. Güçlü finansal analiz altyapımız, disiplinler arası uzman kadromuz ve çözüm odaklı yaklaşımımız sayesinde, işletmelerin karşılaştıkları zorlukları fırsata dönüştürmelerine katkı sağlıyoruz.",
    en: "Every business has different goals, operates in a different sector and pursues a different growth strategy. That is why, instead of one-size-fits-all solutions, we conduct analyses tailored to our clients' needs, develop actionable strategies and provide advisory services that create long-term value. With our strong financial analysis infrastructure, interdisciplinary team of experts and solution-oriented approach, we help businesses turn challenges into opportunities.",
    ru: "У каждого бизнеса свои цели, отрасль и стратегия роста. Поэтому вместо шаблонных решений мы проводим анализ, учитывающий потребности клиента, разрабатываем реализуемые стратегии и предоставляем консалтинговые услуги, создающие долгосрочную ценность. Сильная инфраструктура финансового анализа, междисциплинарная команда экспертов и ориентированный на решения подход помогают компаниям превращать вызовы в возможности.",
  },
  values_json: {
    tr: JSON.stringify([
      { title: "Güven", text: "Her iş ortaklığının temeli karşılıklı güvendir; sözümüzün arkasında dururuz." },
      { title: "Şeffaflık", text: "Süreçlerin her aşamasında açık, net ve izlenebilir iletişim kurarız." },
      { title: "Etik Değerler", text: "Müşteri gizliliği ve profesyonel etik ilkeler tüm çalışmalarımızın pusulasıdır." },
      { title: "Sürdürülebilirlik", text: "Kısa vadeli kazanç yerine uzun vadeli, ölçülebilir değer yaratırız." },
      { title: "Profesyonellik", text: "Disiplinler arası uzman kadromuzla uluslararası standartlarda hizmet veririz." },
    ]),
    en: JSON.stringify([
      { title: "Trust", text: "Mutual trust is the foundation of every partnership; we stand behind our word." },
      { title: "Transparency", text: "We communicate openly, clearly and traceably at every stage of the process." },
      { title: "Ethical Values", text: "Client confidentiality and professional ethics guide everything we do." },
      { title: "Sustainability", text: "We create long-term, measurable value rather than short-term gains." },
      { title: "Professionalism", text: "Our interdisciplinary team of experts delivers to international standards." },
    ]),
    ru: JSON.stringify([
      { title: "Доверие", text: "Взаимное доверие — основа каждого партнёрства; мы отвечаем за свои слова." },
      { title: "Прозрачность", text: "Открытая, ясная и отслеживаемая коммуникация на каждом этапе." },
      { title: "Этические ценности", text: "Конфиденциальность клиентов и профессиональная этика — наш компас." },
      { title: "Устойчивость", text: "Мы создаём долгосрочную, измеримую ценность, а не краткосрочную выгоду." },
      { title: "Профессионализм", text: "Междисциплинарная команда экспертов работает по международным стандартам." },
    ]),
  },
  process_json: {
    tr: JSON.stringify([
      { title: "Keşif", text: "İşletmenizi, hedeflerinizi ve faaliyet gösterdiğiniz pazarı derinlemesine analiz ederiz." },
      { title: "Strateji", text: "İhtiyaçlarınıza özel, uygulanabilir ve ölçülebilir bir yol haritası tasarlarız." },
      { title: "Uygulama", text: "Uzman kadromuz ve çözüm ortaklarımızla stratejiyi hayata geçiririz." },
      { title: "Büyüme", text: "Performansı izler, süreçleri iyileştirir ve sürdürülebilir başarıyı güvence altına alırız." },
    ]),
    en: JSON.stringify([
      { title: "Discovery", text: "We analyse your business, your goals and the market you operate in, in depth." },
      { title: "Strategy", text: "We design an actionable, measurable roadmap tailored to your needs." },
      { title: "Execution", text: "Our expert team and solution partners bring the strategy to life." },
      { title: "Growth", text: "We monitor performance, refine processes and secure sustainable success." },
    ]),
    ru: JSON.stringify([
      { title: "Исследование", text: "Глубоко анализируем ваш бизнес, цели и рынок, на котором вы работаете." },
      { title: "Стратегия", text: "Разрабатываем реализуемую и измеримую дорожную карту под ваши задачи." },
      { title: "Реализация", text: "Наша команда экспертов и партнёры воплощают стратегию в жизнь." },
      { title: "Рост", text: "Отслеживаем результаты, совершенствуем процессы и обеспечиваем устойчивый успех." },
    ]),
  },
  about_body: {
    tr: "SAFARI CONSULTING, finans, yatırım, uluslararası ticaret ve kurumsal danışmanlık alanlarında faaliyet gösteren, işletmelerin sürdürülebilir büyümesini destekleyen profesyonel bir danışmanlık şirketidir. Yerel ve uluslararası pazarlarda edindiğimiz bilgi birikimi ve deneyimle, şirketlere, yatırımcılara ve girişimcilere ihtiyaçlarına özel, stratejik ve sonuç odaklı çözümler sunuyoruz.\n\nUluslararası iş dünyasının dinamiklerini yakından takip ederek, şirketlerin yeni pazarlara açılma süreçlerinden yatırım planlamalarına, kurumsal yapılanmadan operasyonel süreçlerin geliştirilmesine kadar her aşamada profesyonel destek sunuyoruz. Aynı zamanda güvenilir çözüm ortaklarımızla birlikte hareket ederek müşterilerimize hukuk, finans, teknoloji, lojistik, gayrimenkul ve diğer uzmanlık alanlarında entegre danışmanlık hizmetleri sağlıyoruz.\n\nÇalışma anlayışımızın temelinde güven, şeffaflık, etik değerler, sürdürülebilirlik ve profesyonellik yer almaktadır. Her projeye uzun vadeli bir iş ortaklığı yaklaşımıyla bakıyor, müşterilerimizin hedeflerine ulaşmalarını sağlayacak yenilikçi, uygulanabilir ve ölçülebilir çözümler geliştiriyoruz.",
    en: "SAFARI CONSULTING is a professional advisory firm operating in finance, investment, international trade and corporate consulting, supporting the sustainable growth of businesses. Drawing on the knowledge and experience we have gained in local and international markets, we deliver tailored, strategic and result-oriented solutions to companies, investors and entrepreneurs.\n\nClosely following the dynamics of international business, we provide professional support at every stage — from market expansion processes to investment planning, from corporate structuring to the improvement of operational processes. Acting together with our trusted solution partners, we also provide our clients with integrated advisory services in law, finance, technology, logistics, real estate and other areas of expertise.\n\nTrust, transparency, ethical values, sustainability and professionalism lie at the heart of the way we work. We approach every project as a long-term business partnership and develop innovative, actionable and measurable solutions that enable our clients to reach their goals.",
    ru: "SAFARI CONSULTING — профессиональная консалтинговая компания, работающая в сферах финансов, инвестиций, международной торговли и корпоративного консалтинга и поддерживающая устойчивый рост бизнеса. Опираясь на знания и опыт, накопленные на локальных и международных рынках, мы предлагаем компаниям, инвесторам и предпринимателям индивидуальные, стратегические и ориентированные на результат решения.\n\nВнимательно следя за динамикой международного бизнеса, мы оказываем профессиональную поддержку на каждом этапе: от выхода на новые рынки до инвестиционного планирования, от корпоративного структурирования до совершенствования операционных процессов. Вместе с нашими надёжными партнёрами мы предоставляем клиентам интегрированные консалтинговые услуги в области права, финансов, технологий, логистики, недвижимости и других направлений.\n\nВ основе нашего подхода — доверие, прозрачность, этические ценности, устойчивость и профессионализм. Мы рассматриваем каждый проект как долгосрочное партнёрство и разрабатываем инновационные, реализуемые и измеримые решения, позволяющие нашим клиентам достигать поставленных целей.",
  },
  about_mission: {
    tr: "Yerel ve uluslararası ölçekte faaliyet gösteren şirketler, yatırımcılar ve girişimciler için güvenilir, stratejik ve sürdürülebilir bir çözüm ortağı olmak.",
    en: "To be a reliable, strategic and sustainable solution partner for companies, investors and entrepreneurs operating at local and international scale.",
    ru: "Быть надёжным, стратегическим и устойчивым партнёром для компаний, инвесторов и предпринимателей, работающих на локальном и международном уровне.",
  },
  about_vision: {
    tr: "Bilgi ve deneyimimizi, müşterilerimizin büyüme yolculuğuna değer katan çözümlere dönüştürmek.",
    en: "To transform our knowledge and experience into solutions that add value to our clients' growth journey.",
    ru: "Превращать наши знания и опыт в решения, создающие ценность на пути роста наших клиентов.",
  },
  references_intro: {
    tr: "SAFARI CONSULTING olarak bugüne kadar farklı sektörlerde faaliyet gösteren ulusal ve uluslararası birçok kurum, yatırımcı ve şirkete danışmanlık, proje yönetimi ve stratejik çözüm ortaklığı hizmetleri sunduk.",
    en: "To date, SAFARI CONSULTING has provided advisory, project management and strategic solution partnership services to numerous national and international institutions, investors and companies operating across different sectors.",
    ru: "На сегодняшний день SAFARI CONSULTING оказала консалтинговые услуги, услуги по управлению проектами и стратегическому партнёрству множеству национальных и международных организаций, инвесторов и компаний из различных отраслей.",
  },
  references_note: {
    tr: "Müşteri gizliliği ve profesyonel etik ilkelerimiz doğrultusunda, talep edilmesi hâlinde referans çalışmalarımız hakkında daha detaylı bilgi paylaşılabilmektedir.",
    en: "In line with our principles of client confidentiality and professional ethics, more detailed information about our reference projects can be shared upon request.",
    ru: "В соответствии с нашими принципами конфиденциальности клиентов и профессиональной этики более подробная информация о наших референс-проектах может быть предоставлена по запросу.",
  },
  contact_intro: {
    tr: "Projenizi birlikte değerlendirelim. Formu doldurun, uzman ekibimiz en kısa sürede size dönüş yapsın.",
    en: "Let's evaluate your project together. Fill in the form and our expert team will get back to you shortly.",
    ru: "Давайте вместе оценим ваш проект. Заполните форму — наша команда экспертов свяжется с вами в ближайшее время.",
  },
};

const references = ["Altınbaş Holding", "Türk Telekom", "Turkcell", "Vestel", "Türk Hava Yolları (THY)", "Siyah Kalem Mühendislik"];

const settings: Record<string, string> = {
  contact_email: "info@safariconsulting.com",
  notify_email: "bugranuri@gmail.com",
  contact_phone: "+90 (212) 000 00 00",
  contact_address: "İstanbul, Türkiye",
  linkedin_url: "",
  instagram_url: "",
  smtp_host: "",
  smtp_port: "587",
  smtp_user: "",
  smtp_pass: "",
  smtp_from: "",
};

async function main() {
  const passwordHash = await bcrypt.hash("SafariAdmin2026!", 10);
  await prisma.user.upsert({
    where: { email: "admin@safariconsulting.com" },
    update: {},
    create: { email: "admin@safariconsulting.com", passwordHash, name: "Yönetici" },
  });

  for (let i = 0; i < services.length; i++) {
    const s = services[i];
    const svc = await prisma.service.upsert({
      where: { slug: s.slug },
      update: { icon: s.icon, order: i },
      create: { slug: s.slug, icon: s.icon, order: i, visible: true },
    });
    for (const locale of ["tr", "en", "ru"] as const) {
      const t = s[locale];
      await prisma.serviceTranslation.upsert({
        where: { serviceId_locale: { serviceId: svc.id, locale } },
        update: { title: t.title, summary: t.summary, description: t.description, scope: JSON.stringify(t.scope) },
        create: { serviceId: svc.id, locale, title: t.title, summary: t.summary, description: t.description, scope: JSON.stringify(t.scope) },
      });
    }
  }

  for (const [key, locales] of Object.entries(pageContent)) {
    for (const [locale, value] of Object.entries(locales)) {
      await prisma.pageContent.upsert({
        where: { key_locale: { key, locale } },
        update: { value },
        create: { key, locale, value },
      });
    }
  }

  const refCount = await prisma.reference.count();
  if (refCount === 0) {
    for (let i = 0; i < references.length; i++) {
      await prisma.reference.create({ data: { name: references[i], order: i } });
    }
  }

  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
