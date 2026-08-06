import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader, AdminCard, StatusBadge, inputClass } from "@/components/admin/ui";
import SubmitButton from "@/components/admin/SubmitButton";
import ConfirmButton from "@/components/admin/ConfirmButton";
import AdminIcon from "@/components/admin/icons";
import { addReferenceAction, deleteReferenceAction, moveReferenceAction } from "../../actions";

export default async function AdminReferencesPage() {
  const references = await prisma.reference.findMany({ orderBy: { order: "asc" } });

  return (
    <div className="max-w-3xl">
      <PageHeader title="Referanslar" description="Ana sayfada ve referanslar sayfasında görünen kurumları yönetin." />

      <div className="overflow-hidden rounded-xl border border-sand bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand bg-ivory text-left text-xs uppercase tracking-wider text-stone">
              <th className="px-4 py-3">Sıra</th>
              <th className="px-4 py-3">Kurum</th>
              <th className="hidden px-4 py-3 sm:table-cell">Durum</th>
              <th className="px-4 py-3 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {references.map((ref, i) => (
              <tr key={ref.id} className="border-b border-sand last:border-0 hover:bg-ivory/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <form action={moveReferenceAction.bind(null, ref.id, "up")}>
                      <button disabled={i === 0} className="rounded p-1 text-stone hover:text-forest disabled:opacity-25" aria-label="Yukarı taşı">
                        <AdminIcon name="up" className="h-4 w-4" />
                      </button>
                    </form>
                    <form action={moveReferenceAction.bind(null, ref.id, "down")}>
                      <button disabled={i === references.length - 1} className="rounded p-1 text-stone hover:text-forest disabled:opacity-25" aria-label="Aşağı taşı">
                        <AdminIcon name="down" className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-3">
                    <span className="grid h-10 w-16 shrink-0 place-items-center overflow-hidden rounded-md border border-sand bg-ivory">
                      {ref.logo ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={ref.logo} alt="" className="max-h-8 max-w-[85%] object-contain" />
                      ) : (
                        <AdminIcon name="image" className="h-4 w-4 text-stone/40" />
                      )}
                    </span>
                    <span className="font-medium text-ink">{ref.name}</span>
                  </span>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <StatusBadge status={ref.visible ? "replied" : "read"} label={ref.visible ? "Görünür" : "Gizli"} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/references/${ref.id}`}
                      className="rounded-md border border-sand p-2 text-forest hover:border-gold/60"
                      aria-label="Düzenle"
                    >
                      <AdminIcon name="document" className="h-4 w-4" />
                    </Link>
                    <form action={deleteReferenceAction.bind(null, ref.id)}>
                      <ConfirmButton
                        confirmText={`"${ref.name}" referansını silmek istediğinize emin misiniz?`}
                        className="rounded-md border border-red-200 p-2 text-red-600 hover:bg-red-50"
                        ariaLabel="Sil"
                      >
                        <AdminIcon name="trash" className="h-4 w-4" />
                      </ConfirmButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {references.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-stone">
                  Henüz referans eklenmedi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminCard title="Yeni referans ekle" description="Kurum adını girin; ardından açılan sayfada logosunu yükleyebilirsiniz." className="mt-6">
        <form action={addReferenceAction} className="mt-4 flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone">Kurum adı</label>
            <input name="name" required placeholder="Örn. Türk Hava Yolları" className={inputClass} />
          </div>
          <SubmitButton pendingText="Ekleniyor...">
            <AdminIcon name="plus" className="h-4 w-4" /> Ekle
          </SubmitButton>
        </form>
      </AdminCard>
    </div>
  );
}
