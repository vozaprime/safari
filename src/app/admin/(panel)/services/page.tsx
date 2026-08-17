import Link from "next/link";
import { prisma } from "@/lib/db";
import ServiceIcon from "@/components/ServiceIcon";
import {
  PageHeader,
  AdminCard,
  StatusBadge,
  EmptyState,
  inputClass,
  tableWrap,
  tableClass,
  thClass,
  tdClass,
  iconBtnClass,
  iconBtnDanger,
} from "@/components/admin/ui";
import SubmitButton from "@/components/admin/SubmitButton";
import ConfirmButton from "@/components/admin/ConfirmButton";
import AdminIcon from "@/components/admin/icons";
import ViewToolbar from "@/components/admin/ViewToolbar";
import KanbanBoard, { KanbanCard } from "@/components/admin/Kanban";
import {
  createServiceAction,
  deleteServiceAction,
  moveServiceAction,
  setServiceVisibleAction,
  archiveServiceAction,
  restoreServiceAction,
} from "../../actions";

const icons = [
  "finance", "investment", "law", "trade", "market", "company", "brand",
  "project", "compliance", "realestate", "citizenship", "logistics", "partnership",
];

type Svc = Awaited<ReturnType<typeof prisma.service.findMany>>[number] & { translations: { title: string }[] };

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; archived?: string }>;
}) {
  const { view: viewRaw, archived: archivedRaw } = await searchParams;
  const view = viewRaw === "kanban" ? "kanban" : "list";
  const archived = archivedRaw === "1";

  const services = (await prisma.service.findMany({
    where: { archivedAt: archived ? { not: null } : null },
    orderBy: { order: "asc" },
    include: { translations: { where: { locale: "tr" } } },
  })) as Svc[];

  const title = (s: Svc) => s.translations[0]?.title ?? s.slug;

  const actionCluster = (s: Svc, opts: { reorderIdx?: number } = {}) => (
    <div className="flex items-center justify-end gap-0.5">
      {!archived && opts.reorderIdx !== undefined && (
        <>
          <form action={moveServiceAction.bind(null, s.id, "up")}>
            <button disabled={opts.reorderIdx === 0} className={`${iconBtnClass} disabled:opacity-25`} aria-label="Yukarı taşı" title="Yukarı">
              <AdminIcon name="up" className="h-4 w-4" />
            </button>
          </form>
          <form action={moveServiceAction.bind(null, s.id, "down")}>
            <button disabled={opts.reorderIdx === services.length - 1} className={`${iconBtnClass} disabled:opacity-25`} aria-label="Aşağı taşı" title="Aşağı">
              <AdminIcon name="down" className="h-4 w-4" />
            </button>
          </form>
          <span className="mx-0.5 h-5 w-px bg-sand" aria-hidden="true" />
        </>
      )}
      {!archived && (
        <form action={setServiceVisibleAction.bind(null, s.id, !s.visible)}>
          <button className={`${iconBtnClass} ${s.visible ? "text-emerald" : ""}`} aria-label={s.visible ? "Gizle" : "Yayına al"} title={s.visible ? "Gizle" : "Yayına al"}>
            <AdminIcon name="eye" className="h-4 w-4" />
          </button>
        </form>
      )}
      <Link href={`/admin/services/${s.id}`} className={iconBtnClass} aria-label="Düzenle" title="Düzenle">
        <AdminIcon name="edit" className="h-4 w-4" />
      </Link>
      {archived ? (
        <form action={restoreServiceAction.bind(null, s.id)}>
          <button className={iconBtnClass} aria-label="Arşivden çıkar" title="Arşivden çıkar">
            <AdminIcon name="restore" className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <form action={archiveServiceAction.bind(null, s.id)}>
          <button className={iconBtnClass} aria-label="Arşivle" title="Arşivle">
            <AdminIcon name="archive" className="h-4 w-4" />
          </button>
        </form>
      )}
      <form action={deleteServiceAction.bind(null, s.id)}>
        <ConfirmButton confirmText={`"${title(s)}" hizmetini kalıcı olarak silmek istediğinize emin misiniz?`} className={iconBtnDanger} ariaLabel="Sil">
          <AdminIcon name="trash" className="h-4 w-4" />
        </ConfirmButton>
      </form>
    </div>
  );

  const kanbanCard = (s: Svc) => (
    <KanbanCard key={s.id}>
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-ivory text-forest">
          <ServiceIcon icon={s.icon} className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{title(s)}</span>
      </div>
      <div className="mt-2.5 border-t border-sand pt-2">{actionCluster(s)}</div>
    </KanbanCard>
  );

  const cols = [
    { key: "visible", label: "Yayında", dot: "bg-emerald", items: services.filter((s) => s.visible) },
    { key: "hidden", label: "Gizli", dot: "bg-stone", items: services.filter((s) => !s.visible) },
  ];

  return (
    <div>
      <PageHeader title="Hizmetler" description="Hizmet içeriklerini üç dilde düzenleyin, sıralayın, ekleyin veya kaldırın." />

      <ViewToolbar basePath="/admin/services" params={{ view: viewRaw, archived: archivedRaw }} />

      {services.length === 0 ? (
        <EmptyState text={archived ? "Arşivlenmiş hizmet yok." : "Henüz hizmet eklenmedi."} />
      ) : view === "kanban" ? (
        <KanbanBoard columns={cols.map((c) => ({ key: c.key, label: c.label, dot: c.dot, count: c.items.length, cards: c.items.map(kanbanCard) }))} />
      ) : (
        <div className={tableWrap}>
          <table className={tableClass}>
            <thead>
              <tr className="border-b border-sand bg-ivory">
                <th className={thClass}>Hizmet</th>
                <th className={`${thClass} hidden sm:table-cell`}>Durum</th>
                <th className={`${thClass} text-right`}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s, i) => (
                <tr key={s.id} className="border-b border-sand last:border-0 hover:bg-ivory/40">
                  <td className={tdClass}>
                    <span className="flex items-center gap-3 font-medium text-ink">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-ivory text-forest">
                        <ServiceIcon icon={s.icon} className="h-5 w-5" />
                      </span>
                      {title(s)}
                    </span>
                  </td>
                  <td className={`${tdClass} hidden sm:table-cell`}>
                    <StatusBadge status={s.visible ? "replied" : "read"} label={s.visible ? "Yayında" : "Gizli"} />
                  </td>
                  <td className={tdClass}>{actionCluster(s, { reorderIdx: i })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!archived && (
        <AdminCard title="Yeni hizmet ekle" description="Başlangıç başlığını girin; ardından detay sayfasında üç dilde içerik ekleyin." className="mt-6">
          <form action={createServiceAction} className="mt-4 flex flex-wrap items-end gap-3">
            <div className="min-w-56 flex-1">
              <label htmlFor="title" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone">
                Hizmet başlığı (Türkçe)
              </label>
              <input id="title" name="title" required placeholder="Örn. Sigorta Danışmanlığı" className={inputClass} />
            </div>
            <div>
              <label htmlFor="icon" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone">İkon</label>
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
      )}
    </div>
  );
}
