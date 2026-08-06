import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader, AdminCard, inputClass, labelClass, Field } from "@/components/admin/ui";
import SubmitButton from "@/components/admin/SubmitButton";
import ConfirmButton from "@/components/admin/ConfirmButton";
import Uploader from "@/components/admin/Uploader";
import { updateReferenceFullAction, deleteReferenceAction } from "../../../actions";

export default async function EditReferencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ref = await prisma.reference.findUnique({ where: { id: Number(id) } });
  if (!ref) notFound();

  return (
    <div className="max-w-xl">
      <Link href="/admin/references" className="mb-4 inline-flex items-center gap-1.5 text-xs text-stone hover:text-forest">
        ← Referanslar
      </Link>
      <PageHeader title={`Referansı düzenle — ${ref.name}`} />

      <form action={updateReferenceFullAction.bind(null, ref.id)}>
        <AdminCard>
          <div className="space-y-5">
            <div>
              <p className={labelClass}>Logo</p>
              <Uploader name="logo" defaultValue={ref.logo} label="Logo" aspect="aspect-[3/2]" />
              <p className="mt-2 text-[11px] text-stone/60">Logo boş bırakılırsa kurum adı yazı olarak gösterilir.</p>
            </div>
            <Field label="Kurum adı" htmlFor="name">
              <input id="name" name="name" defaultValue={ref.name} required className={inputClass} />
            </Field>
            <div className="flex items-end gap-4">
              <div className="w-24">
                <Field label="Sıra" htmlFor="order">
                  <input id="order" name="order" type="number" defaultValue={ref.order} className={inputClass} />
                </Field>
              </div>
              <label className="flex items-center gap-2 pb-2.5 text-sm text-ink">
                <input type="checkbox" name="visible" defaultChecked={ref.visible} className="h-4 w-4 accent-forest" />
                Sitede göster
              </label>
            </div>
          </div>
        </AdminCard>

        <div className="mt-5 flex items-center gap-3">
          <SubmitButton pendingText="Kaydediliyor...">Kaydet</SubmitButton>
          <Link href="/admin/references" className="text-sm text-stone hover:text-forest">Vazgeç</Link>
        </div>
      </form>

      <form action={deleteReferenceAction.bind(null, ref.id)} className="mt-8 border-t border-sand pt-4">
        <ConfirmButton
          confirmText={`"${ref.name}" referansını silmek istediğinize emin misiniz?`}
          className="text-xs text-red-500 hover:underline"
        >
          Referansı sil
        </ConfirmButton>
      </form>
    </div>
  );
}
