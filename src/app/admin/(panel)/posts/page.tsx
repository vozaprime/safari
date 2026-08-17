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
  createPostAction,
  deletePostAction,
  setPostPublishedAction,
  archivePostAction,
  restorePostAction,
} from "../../actions";

type Post = Awaited<ReturnType<typeof prisma.post.findMany>>[number] & { translations: { title: string }[] };

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; archived?: string }>;
}) {
  const { view: viewRaw, archived: archivedRaw } = await searchParams;
  const view = viewRaw === "kanban" ? "kanban" : "list";
  const archived = archivedRaw === "1";

  const posts = (await prisma.post.findMany({
    where: { archivedAt: archived ? { not: null } : null },
    orderBy: { createdAt: "desc" },
    include: { translations: { where: { locale: "tr" } } },
  })) as Post[];

  const title = (p: Post) => p.translations[0]?.title ?? p.slug;
  const cover = (p: Post) => (
    <span className="grid h-10 w-14 shrink-0 place-items-center overflow-hidden rounded-md border border-sand bg-ivory">
      {p.cover ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={p.cover} alt="" className="h-full w-full object-cover" />
      ) : (
        <AdminIcon name="news" className="h-4 w-4 text-stone/40" />
      )}
    </span>
  );

  const actionCluster = (p: Post) => (
    <div className="flex items-center justify-end gap-0.5">
      {!archived && (
        <form action={setPostPublishedAction.bind(null, p.id, !p.published)}>
          <button className={`${iconBtnClass} ${p.published ? "text-emerald" : ""}`} aria-label={p.published ? "Taslağa al" : "Yayınla"} title={p.published ? "Taslağa al" : "Yayınla"}>
            <AdminIcon name={p.published ? "eye" : "check"} className="h-4 w-4" />
          </button>
        </form>
      )}
      <Link href={`/admin/posts/${p.id}`} className={iconBtnClass} aria-label="Düzenle" title="Düzenle">
        <AdminIcon name="edit" className="h-4 w-4" />
      </Link>
      {archived ? (
        <form action={restorePostAction.bind(null, p.id)}>
          <button className={iconBtnClass} aria-label="Arşivden çıkar" title="Arşivden çıkar">
            <AdminIcon name="restore" className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <form action={archivePostAction.bind(null, p.id)}>
          <button className={iconBtnClass} aria-label="Arşivle" title="Arşivle">
            <AdminIcon name="archive" className="h-4 w-4" />
          </button>
        </form>
      )}
      <form action={deletePostAction.bind(null, p.id)}>
        <ConfirmButton confirmText={`"${title(p)}" yazısını kalıcı olarak silmek istediğinize emin misiniz?`} className={iconBtnDanger} ariaLabel="Sil">
          <AdminIcon name="trash" className="h-4 w-4" />
        </ConfirmButton>
      </form>
    </div>
  );

  const kanbanCard = (p: Post) => (
    <KanbanCard key={p.id}>
      <div className="flex items-center gap-2.5">
        {cover(p)}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{title(p)}</p>
          <p className="text-xs text-stone/70">{new Date(p.createdAt).toLocaleDateString("tr-TR")}</p>
        </div>
      </div>
      <div className="mt-2.5 border-t border-sand pt-2">{actionCluster(p)}</div>
    </KanbanCard>
  );

  const cols = [
    { key: "published", label: "Yayında", dot: "bg-emerald", items: posts.filter((p) => p.published) },
    { key: "draft", label: "Taslak", dot: "bg-gold", items: posts.filter((p) => !p.published) },
  ];

  return (
    <div className="max-w-3xl">
      <PageHeader title="Blog / Haberler" description="İçgörü ve haber yazılarını üç dilde yönetin. Yayınlanan yazılar sitede görünür." />

      <ViewToolbar basePath="/admin/posts" params={{ view: viewRaw, archived: archivedRaw }} />

      {posts.length === 0 ? (
        <EmptyState text={archived ? "Arşivlenmiş yazı yok." : "Henüz yazı yok. Aşağıdan ilk yazınızı ekleyin."} />
      ) : view === "kanban" ? (
        <KanbanBoard columns={cols.map((c) => ({ key: c.key, label: c.label, dot: c.dot, count: c.items.length, cards: c.items.map(kanbanCard) }))} />
      ) : (
        <div className={tableWrap}>
          <table className={tableClass}>
            <thead>
              <tr className="border-b border-sand bg-ivory">
                <th className={thClass}>Başlık</th>
                <th className={`${thClass} hidden sm:table-cell`}>Tarih</th>
                <th className={thClass}>Durum</th>
                <th className={`${thClass} text-right`}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-b border-sand last:border-0 hover:bg-ivory/40">
                  <td className={tdClass}>
                    <span className="flex items-center gap-3">
                      {cover(p)}
                      <span className="font-medium text-ink">{title(p)}</span>
                    </span>
                  </td>
                  <td className={`${tdClass} hidden text-xs text-stone sm:table-cell`}>
                    {new Date(p.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className={tdClass}>
                    <StatusBadge status={p.published ? "replied" : "read"} label={p.published ? "Yayında" : "Taslak"} />
                  </td>
                  <td className={tdClass}>{actionCluster(p)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!archived && (
        <AdminCard title="Yeni yazı ekle" description="Başlığı girin; açılan sayfada içeriği üç dilde yazıp yayınlayabilirsiniz." className="mt-6">
          <form action={createPostAction} className="mt-4 flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone">Yazı başlığı (Türkçe)</label>
              <input name="title" required placeholder="Örn. 2026'da yatırım trendleri" className={inputClass} />
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
