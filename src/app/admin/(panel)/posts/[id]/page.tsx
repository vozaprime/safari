import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader, AdminCard, inputClass, labelClass, Field } from "@/components/admin/ui";
import SubmitButton from "@/components/admin/SubmitButton";
import Uploader from "@/components/admin/Uploader";
import RichTextEditor from "@/components/admin/RichTextEditor";
import AdminIcon from "@/components/admin/icons";
import { updatePostAction } from "../../../actions";

const localeTitles: Record<string, string> = { tr: "Türkçe", en: "İngilizce", ru: "Rusça" };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id: Number(id) }, include: { translations: true } });
  if (!post) notFound();
  const byLocale = Object.fromEntries(post.translations.map((t) => [t.locale, t]));

  return (
    <div className="max-w-3xl">
      <Link href="/admin/posts" className="mb-4 inline-flex items-center gap-1.5 text-xs text-stone hover:text-forest">
        ← Blog
      </Link>
      <PageHeader title={`Yazıyı düzenle — ${byLocale.tr?.title ?? post.slug}`}>
        {post.published && (
          <Link href={`/tr/blog/${post.slug}`} target="_blank" className="inline-flex items-center gap-1.5 rounded-md border border-sand px-3 py-2 text-xs text-forest hover:border-gold/60">
            <AdminIcon name="external" className="h-4 w-4" /> Sitede önizle
          </Link>
        )}
      </PageHeader>

      <form action={updatePostAction.bind(null, post.id)} className="space-y-6">
        <AdminCard title="Genel">
          <div className="mt-4 space-y-5">
            <div>
              <p className={labelClass}>Kapak görseli</p>
              <Uploader name="cover" defaultValue={post.cover} label="Kapak" aspect="aspect-[16/9]" />
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1">
                <Field label="URL adı (slug)" htmlFor="slug" hint="değiştirmezseniz aynı kalır">
                  <input id="slug" name="slug" defaultValue={post.slug} className={inputClass} />
                </Field>
              </div>
              <label className="flex items-center gap-2 pb-2.5 text-sm text-ink">
                <input type="checkbox" name="published" defaultChecked={post.published} className="h-4 w-4 accent-forest" />
                Yayınla
              </label>
            </div>
          </div>
        </AdminCard>

        {(["tr", "en", "ru"] as const).map((locale) => {
          const t = byLocale[locale];
          return (
            <AdminCard key={locale} title={localeTitles[locale]}>
              <div className="mt-4 space-y-4">
                <Field label="Başlık" htmlFor={`${locale}_title`}>
                  <input id={`${locale}_title`} name={`${locale}_title`} defaultValue={t?.title ?? ""} className={inputClass} />
                </Field>
                <Field label="Özet (liste kartlarında görünür)" htmlFor={`${locale}_excerpt`}>
                  <textarea id={`${locale}_excerpt`} name={`${locale}_excerpt`} rows={2} defaultValue={t?.excerpt ?? ""} className={inputClass} />
                </Field>
                <Field label="İçerik">
                  <RichTextEditor
                    name={`${locale}_body`}
                    defaultValue={t?.body ?? ""}
                    rows={14}
                    hint="Araç çubuğu: kalın · italik · ara başlık · alıntı · liste · görsel. Boş satır yeni paragraf açar."
                  />
                </Field>
              </div>
            </AdminCard>
          );
        })}

        <div className="flex items-center gap-3">
          <SubmitButton pendingText="Kaydediliyor...">Kaydet</SubmitButton>
          <Link href="/admin/posts" className="text-sm text-stone hover:text-forest">Vazgeç</Link>
        </div>
      </form>
    </div>
  );
}
