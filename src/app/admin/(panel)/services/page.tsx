import Link from "next/link";
import { prisma } from "@/lib/db";
import ServiceIcon from "@/components/ServiceIcon";
import { PageHeader, AdminCard, StatusBadge, inputClass } from "@/components/admin/ui";
import SubmitButton from "@/components/admin/SubmitButton";
import ConfirmButton from "@/components/admin/ConfirmButton";
import AdminIcon from "@/components/admin/icons";
import { createServiceAction, deleteServiceAction, moveServiceAction } from "../../actions";

const icons = [
  "finance", "investment", "law", "trade", "market", "company", "brand",
  "project", "compliance", "realestate", "citizenship", "logistics", "partnership",
];

export default async function AdminServicesPage() {
  const services = await prisma.service.findMany({
    orderBy: { order: "asc" },
    include: { translations: { where: { locale: "tr" } } },
  });

  return (
    <div>
      <PageHeader title="Hizmetler" description="Hizmet içeriklerini üç dilde düzenleyin, sıralayın, ekleyin veya kaldırın." />

      <div className="overflow-hidden rounded-xl border border-sand bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand bg-ivory text-left text-xs uppercase tracking-wider text-stone">
              <th className="px-4 py-3">Sıra</th>
              <th className="px-4 py-3">Hizmet</th>
              <th className="hidden px-4 py-3 sm:table-cell">Durum</th>
              <th className="px-4 py-3 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service, i) => (
              <tr key={service.id} className="border-b border-sand last:border-0 hover:bg-ivory/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <form action={moveServiceAction.bind(null, service.id, "up")}>
                      <button disabled={i === 0} className="rounded p-1 text-stone hover:text-forest disabled:opacity-25" aria-label="Yukarı taşı">
                        <AdminIcon name="up" className="h-4 w-4" />
                      </button>
                    </form>
                    <form action={moveServiceAction.bind(null, service.id, "down")}>
                      <button disabled={i === services.length - 1} className="rounded p-1 text-stone hover:text-forest disabled:opacity-25" aria-label="Aşağı taşı">
                        <AdminIcon name="down" className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-3 font-medium text-ink">
                    <span className="grid h-9 w-9 place-items-center rounded-md bg-ivory text-forest">
                      <ServiceIcon icon={service.icon} className="h-5 w-5" />
                    </span>
                    {service.translations[0]?.title ?? service.slug}
                  </span>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <StatusBadge status={service.visible ? "replied" : "read"} label={service.visible ? "Yayında" : "Gizli"} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/services/${service.id}`}
                      className="rounded-md border border-sand px-3 py-1.5 text-xs font-medium text-forest hover:border-gold/60"
                    >
                      Düzenle
                    </Link>
                    <form action={deleteServiceAction.bind(null, service.id)}>
                      <ConfirmButton
                        confirmText={`"${service.translations[0]?.title ?? service.slug}" hizmetini silmek istediğinize emin misiniz?`}
                        className="rounded-md border border-red-200 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50"
                        ariaLabel="Sil"
                      >
                        <AdminIcon name="trash" className="h-4 w-4" />
                      </ConfirmButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminCard title="Yeni hizmet ekle" description="Başlangıç başlığını girin; ardından detay sayfasında üç dilde içerik ekleyin." className="mt-6">
        <form action={createServiceAction} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1">
            <label htmlFor="title" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone">
              Hizmet başlığı (Türkçe)
            </label>
            <input id="title" name="title" required placeholder="Örn. Sigorta Danışmanlığı" className={inputClass} />
          </div>
          <div>
            <label htmlFor="icon" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone">
              İkon
            </label>
            <select id="icon" name="icon" className={inputClass}>
              {icons.map((ic) => (
                <option key={ic} value={ic}>{ic}</option>
              ))}
            </select>
          </div>
          <SubmitButton pendingText="Ekleniyor...">
            <AdminIcon name="plus" className="h-4 w-4" /> Ekle
          </SubmitButton>
        </form>
      </AdminCard>
    </div>
  );
}
