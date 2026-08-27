import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { slugIn } from "@/lib/content";
import { localePath } from "@/lib/i18n";
import { PageHeader, AdminCard, inputClass, labelClass, Field } from "@/components/admin/ui";
import SubmitButton from "@/components/admin/SubmitButton";
import Uploader from "@/components/admin/Uploader";
import RichTextEditor from "@/components/admin/RichTextEditor";
import AdminIcon from "@/components/admin/icons";
import { updateServiceAction } from "../../../actions";

const icons = [
  "finance", "investment", "law", "trade", "market", "company", "brand",
  "project", "compliance", "realestate", "citizenship", "logistics", "partnership",
];
const localeTitles: Record<string, string> = { tr: "Türkçe", en: "İngilizce", ru: "Rusça" };

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = await prisma.service.findUnique({
    where: { id: Number(id) },
    include: { translations: true },
  });
  if (!service) notFound();

  const byLocale = Object.fromEntries(service.translations.map((tr) => [tr.locale, tr]));

  return (
    <div className="max-w-3xl">
      <Link href="/admin/services" className="mb-4 inline-flex items-center gap-1.5 text-xs text-stone hover:text-forest">
        ← Hizmetler
      </Link>
      <PageHeader title={`Hizmeti düzenle — ${byLocale.tr?.title ?? service.slug}`}>
        <Link
          href={localePath("tr", "services", slugIn(service.slug, service.translations, "tr"))}
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-md border border-sand px-3 py-2 text-xs text-forest hover:border-gold/60"
        >
          <AdminIcon name="external" className="h-4 w-4" /> Sitede önizle
        </Link>
      </PageHeader>

      <form action={updateServiceAction.bind(null, service.id)} className="space-y-6">
        <AdminCard title="Genel">
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="İkon" htmlFor="icon">
              <select id="icon" name="icon" defaultValue={service.icon} className={inputClass}>
                {icons.map((ic) => (
                  <option key={ic} value={ic}>{ic}</option>
                ))}
              </select>
            </Field>
            <Field label="Sıra" htmlFor="order">
              <input id="order" name="order" type="number" defaultValue={service.order} className={inputClass} />
            </Field>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" name="visible" defaultChecked={service.visible} className="h-4 w-4 accent-forest" />
                Sitede göster
              </label>
            </div>
          </div>
          <div className="mt-5">
            <p className={labelClass}>Görsel (kart ve detay banner&apos;ı)</p>
            <Uploader name="image" defaultValue={service.image} label="Görsel" />
            <p className="mt-2 text-[11px] text-stone/60">Boş bırakılırsa varsayılan /images/services/{service.slug}.jpg kullanılır.</p>
          </div>
        </AdminCard>

        {(["tr", "en", "ru"] as const).map((locale) => {
          const tr = byLocale[locale];
          const scopeText = tr ? (JSON.parse(tr.scope) as string[]).join("\n") : "";
          return (
            <AdminCard key={locale} title={localeTitles[locale]}>
              <div className="mt-4 space-y-4">
                <Field label="Başlık" htmlFor={`${locale}_title`}>
                  <input id={`${locale}_title`} name={`${locale}_title`} defaultValue={tr?.title ?? ""} className={inputClass} />
                </Field>
                <Field
                  label="URL adı (bu dilde)"
                  htmlFor={`${locale}_slug`}
                  hint="boş bırakılırsa ortak URL adı kullanılır; değiştirirseniz eski adres kalıcı olarak yenisine yönlenir"
                >
                  <input id={`${locale}_slug`} name={`${locale}_slug`} defaultValue={tr?.slug ?? ""} className={inputClass} />
                </Field>
                <Field label="Kısa özet (kartlarda görünür)" htmlFor={`${locale}_summary`}>
                  <textarea id={`${locale}_summary`} name={`${locale}_summary`} rows={2} defaultValue={tr?.summary ?? ""} className={inputClass} />
                </Field>
                <Field label="Açıklama (makale metni)">
                  <RichTextEditor
                    name={`${locale}_description`}
                    defaultValue={tr?.description ?? ""}
                    rows={14}
                    hint="Araç çubuğu: kalın · italik · ara başlık · alıntı · liste · görsel. Boş satır yeni paragraf açar."
                  />
                </Field>
                <Field label="Hizmet kapsamı (her satır bir madde)" htmlFor={`${locale}_scope`}>
                  <textarea id={`${locale}_scope`} name={`${locale}_scope`} rows={5} defaultValue={scopeText} className={inputClass} />
                </Field>
              </div>
            </AdminCard>
          );
        })}

        <div className="flex items-center gap-3">
          <SubmitButton pendingText="Kaydediliyor...">Kaydet</SubmitButton>
          <Link href="/admin/services" className="text-sm text-stone hover:text-forest">Vazgeç</Link>
        </div>
      </form>
    </div>
  );
}
