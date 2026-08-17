import Link from "next/link";
import { prisma } from "@/lib/db";
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
  addReferenceAction,
  deleteReferenceAction,
  moveReferenceAction,
  setReferenceVisibleAction,
  archiveReferenceAction,
  restoreReferenceAction,
} from "../../actions";

type Ref = Awaited<ReturnType<typeof prisma.reference.findMany>>[number];

export default async function AdminReferencesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; archived?: string }>;
}) {
  const { view: viewRaw, archived: archivedRaw } = await searchParams;
  const view = viewRaw === "kanban" ? "kanban" : "list";
  const archived = archivedRaw === "1";

  const references = await prisma.reference.findMany({
    where: { archivedAt: archived ? { not: null } : null },
    orderBy: { order: "asc" },
  });

  const logoThumb = (ref: Ref) => (
    <span className="grid h-10 w-16 shrink-0 place-items-center overflow-hidden rounded-md border border-sand bg-ivory">
      {ref.logo ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={ref.logo} alt="" className="max-h-8 max-w-[85%] object-contain" />
      ) : (
        <AdminIcon name="image" className="h-4 w-4 text-stone/40" />
      )}
    </span>
  );

  const actionCluster = (ref: Ref, opts: { reorderIdx?: number } = {}) => (
    <div className="flex items-center justify-end gap-0.5">
      {!archived && opts.reorderIdx !== undefined && (
        <>
          <form action={moveReferenceAction.bind(null, ref.id, "up")}>
            <button disabled={opts.reorderIdx === 0} className={`${iconBtnClass} disabled:opacity-25`} aria-label="Yukarı taşı" title="Yukarı">
              <AdminIcon name="up" className="h-4 w-4" />
            </button>
          </form>
          <form action={moveReferenceAction.bind(null, ref.id, "down")}>
            <button disabled={opts.reorderIdx === references.length - 1} className={`${iconBtnClass} disabled:opacity-25`} aria-label="Aşağı taşı" title="Aşağı">
              <AdminIcon name="down" className="h-4 w-4" />
            </button>
          </form>
          <span className="mx-0.5 h-5 w-px bg-sand" aria-hidden="true" />
        </>
      )}
      {!archived && (
        <form action={setReferenceVisibleAction.bind(null, ref.id, !ref.visible)}>
          <button className={`${iconBtnClass} ${ref.visible ? "text-emerald" : ""}`} aria-label={ref.visible ? "Gizle" : "Görünür yap"} title={ref.visible ? "Gizle" : "Görünür yap"}>
            <AdminIcon name="eye" className="h-4 w-4" />
          </button>
        </form>
      )}
      <Link href={`/admin/references/${ref.id}`} className={iconBtnClass} aria-label="Düzenle" title="Düzenle">
        <AdminIcon name="edit" className="h-4 w-4" />
      </Link>
      {archived ? (
        <form action={restoreReferenceAction.bind(null, ref.id)}>
          <button className={iconBtnClass} aria-label="Arşivden çıkar" title="Arşivden çıkar">
            <AdminIcon name="restore" className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <form action={archiveReferenceAction.bind(null, ref.id)}>
          <button className={iconBtnClass} aria-label="Arşivle" title="Arşivle">
            <AdminIcon name="archive" className="h-4 w-4" />
          </button>
        </form>
      )}
      <form action={deleteReferenceAction.bind(null, ref.id)}>
        <ConfirmButton confirmText={`"${ref.name}" referansını kalıcı olarak silmek istediğinize emin misiniz?`} className={iconBtnDanger} ariaLabel="Sil">
          <AdminIcon name="trash" className="h-4 w-4" />
        </ConfirmButton>
      </form>
    </div>
  );

  const kanbanCard = (ref: Ref) => (
    <KanbanCard key={ref.id}>
      <div className="flex items-center gap-2.5">
        {logoThumb(ref)}
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{ref.name}</span>
      </div>
      <div className="mt-2.5 border-t border-sand pt-2">{actionCluster(ref)}</div>
    </KanbanCard>
  );

  const cols = [
    { key: "visible", label: "Görünür", dot: "bg-emerald", items: references.filter((r) => r.visible) },
    { key: "hidden", label: "Gizli", dot: "bg-stone", items: references.filter((r) => !r.visible) },
  ];

  return (
    <div className="max-w-3xl">
      <PageHeader title="Referanslar" description="Ana sayfada ve referanslar sayfasında görünen kurumları yönetin." />

      <ViewToolbar basePath="/admin/references" params={{ view: viewRaw, archived: archivedRaw }} />

      {references.length === 0 ? (
        <EmptyState text={archived ? "Arşivlenmiş referans yok." : "Henüz referans eklenmedi."} />
      ) : view === "kanban" ? (
        <KanbanBoard columns={cols.map((c) => ({ key: c.key, label: c.label, dot: c.dot, count: c.items.length, cards: c.items.map(kanbanCard) }))} />
      ) : (
        <div className={tableWrap}>
          <table className={tableClass}>
            <thead>
              <tr className="border-b border-sand bg-ivory">
                <th className={thClass}>Kurum</th>
                <th className={`${thClass} hidden sm:table-cell`}>Durum</th>
                <th className={`${thClass} text-right`}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {references.map((ref, i) => (
                <tr key={ref.id} className="border-b border-sand last:border-0 hover:bg-ivory/40">
                  <td className={tdClass}>
                    <span className="flex items-center gap-3">
                      {logoThumb(ref)}
                      <span className="font-medium text-ink">{ref.name}</span>
                    </span>
                  </td>
                  <td className={`${tdClass} hidden sm:table-cell`}>
                    <StatusBadge status={ref.visible ? "replied" : "read"} label={ref.visible ? "Görünür" : "Gizli"} />
                  </td>
                  <td className={tdClass}>{actionCluster(ref, { reorderIdx: i })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!archived && (
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
      )}
    </div>
  );
}
