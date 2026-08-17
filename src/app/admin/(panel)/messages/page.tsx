import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader, StatusBadge, EmptyState, tableWrap, iconBtnClass, iconBtnDanger } from "@/components/admin/ui";
import AdminIcon from "@/components/admin/icons";
import SelectAll from "@/components/admin/SelectAll";
import ConfirmButton from "@/components/admin/ConfirmButton";
import ViewToolbar from "@/components/admin/ViewToolbar";
import KanbanBoard, { KanbanCard } from "@/components/admin/Kanban";
import {
  bulkMessageAction,
  moveMessageStatusAction,
  archiveMessageAction,
  restoreMessageAction,
  deleteMessageAction,
} from "../../actions";
import type { Prisma } from "@prisma/client";

type Msg = Awaited<ReturnType<typeof prisma.contactMessage.findMany>>[number];

const STATUSES = [
  { key: "new", label: "Yeni", dot: "bg-gold" },
  { key: "read", label: "Okundu", dot: "bg-stone" },
  { key: "replied", label: "Yanıtlandı", dot: "bg-emerald" },
];
const statusLabels: Record<string, string> = { new: "Yeni", read: "Okundu", replied: "Yanıtlandı" };
const PAGE_SIZE = 15;

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; archived?: string; status?: string; q?: string; page?: string }>;
}) {
  const { view: viewRaw, archived: archivedRaw, status, q, page } = await searchParams;
  const isKanban = viewRaw === "kanban";
  const isArchived = archivedRaw === "1";
  const search = (q ?? "").trim();
  const currentPage = Math.max(1, Number(page) || 1);

  const searchWhere: Prisma.ContactMessageWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { company: { contains: search, mode: "insensitive" } },
          { message: { contains: search, mode: "insensitive" } },
          { service: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};
  const archivedWhere: Prisma.ContactMessageWhereInput = { archivedAt: isArchived ? { not: null } : null };

  const detailHref = (id: number) => `/admin/messages/${id}`;

  const rowActions = (m: Msg) => (
    <div className="flex items-center justify-end gap-0.5">
      <Link href={detailHref(m.id)} className={iconBtnClass} title="Aç" aria-label="Aç">
        <AdminIcon name="mail" className="h-4 w-4" />
      </Link>
      {isArchived ? (
        <form action={restoreMessageAction.bind(null, m.id)}>
          <button className={iconBtnClass} title="Arşivden çıkar" aria-label="Arşivden çıkar">
            <AdminIcon name="restore" className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <form action={archiveMessageAction.bind(null, m.id)}>
          <button className={iconBtnClass} title="Arşivle" aria-label="Arşivle">
            <AdminIcon name="archive" className="h-4 w-4" />
          </button>
        </form>
      )}
      <form action={deleteMessageAction.bind(null, m.id)}>
        <ConfirmButton confirmText={`"${m.name}" talebini kalıcı olarak silmek istediğinize emin misiniz?`} className={iconBtnDanger} ariaLabel="Sil">
          <AdminIcon name="trash" className="h-4 w-4" />
        </ConfirmButton>
      </form>
    </div>
  );

  const kanbanCard = (m: Msg) => (
    <KanbanCard key={m.id}>
      <Link href={detailHref(m.id)} className="block">
        <p className="truncate text-sm font-semibold text-ink">{m.name}</p>
        <p className="truncate text-xs text-stone">{m.email}</p>
        {m.service && <p className="mt-0.5 truncate text-xs text-stone/70">{m.service}</p>}
        <p className="mt-0.5 text-[11px] text-stone/60">{new Date(m.createdAt).toLocaleDateString("tr-TR")}</p>
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-sand pt-2">
        {!isArchived &&
          STATUSES.filter((s) => s.key !== m.status).map((s) => (
            <form key={s.key} action={moveMessageStatusAction.bind(null, m.id, s.key)}>
              <button className="rounded px-1.5 py-0.5 text-[11px] font-medium text-stone transition-colors hover:bg-ivory hover:text-forest">
                → {s.label}
              </button>
            </form>
          ))}
        <div className="ml-auto flex items-center gap-0.5">
          {isArchived ? (
            <form action={restoreMessageAction.bind(null, m.id)}>
              <button className={iconBtnClass} title="Arşivden çıkar" aria-label="Arşivden çıkar">
                <AdminIcon name="restore" className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <form action={archiveMessageAction.bind(null, m.id)}>
              <button className={iconBtnClass} title="Arşivle" aria-label="Arşivle">
                <AdminIcon name="archive" className="h-4 w-4" />
              </button>
            </form>
          )}
          <form action={deleteMessageAction.bind(null, m.id)}>
            <ConfirmButton confirmText={`"${m.name}" silinsin mi?`} className={iconBtnDanger} ariaLabel="Sil">
              <AdminIcon name="trash" className="h-4 w-4" />
            </ConfirmButton>
          </form>
        </div>
      </div>
    </KanbanCard>
  );

  const csvLink = (
    <a
      href={`/api/admin/messages/export${status ? `?status=${status}` : ""}`}
      className="inline-flex items-center gap-2 rounded-md border border-sand bg-white px-3 py-1.5 text-xs font-medium text-forest hover:border-gold/60"
    >
      <AdminIcon name="download" className="h-4 w-4" /> CSV
    </a>
  );
  const searchForm = (
    <form method="get" className="flex items-center gap-2">
      {viewRaw && <input type="hidden" name="view" value={viewRaw} />}
      {isArchived && <input type="hidden" name="archived" value="1" />}
      {status && !isKanban && <input type="hidden" name="status" value={status} />}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone/50">
          <AdminIcon name="search" className="h-4 w-4" />
        </span>
        <input name="q" defaultValue={search} placeholder="Ara..." className="w-48 rounded-md border border-sand bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-gold" />
      </div>
    </form>
  );

  // ---------------- KANBAN ----------------
  if (isKanban) {
    const msgs = await prisma.contactMessage.findMany({
      where: { ...archivedWhere, ...searchWhere },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    const total = msgs.length;
    return (
      <div>
        <PageHeader title="İletişim Talepleri" description={`${total} kayıt${total === 200 ? "+ (son 200)" : ""}`} />
        <ViewToolbar basePath="/admin/messages" params={{ view: viewRaw, archived: archivedRaw, q: search || undefined }} right={<>{searchForm}{csvLink}</>} />
        {total === 0 ? (
          <EmptyState text={isArchived ? "Arşivlenmiş talep yok." : "Talep bulunmuyor."} />
        ) : (
          <KanbanBoard
            columns={STATUSES.map((s) => {
              const items = msgs.filter((m) => m.status === s.key);
              return { key: s.key, label: s.label, dot: s.dot, count: items.length, cards: items.map(kanbanCard) };
            })}
          />
        )}
      </div>
    );
  }

  // ---------------- LIST ----------------
  const listWhere: Prisma.ContactMessageWhereInput = {
    ...archivedWhere,
    ...searchWhere,
    ...(status && ["new", "read", "replied"].includes(status) ? { status } : {}),
  };
  const [total, messages] = await Promise.all([
    prisma.contactMessage.count({ where: listWhere }),
    prisma.contactMessage.findMany({ where: listWhere, orderBy: { createdAt: "desc" }, skip: (currentPage - 1) * PAGE_SIZE, take: PAGE_SIZE }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const tabs = [{ key: "", label: "Tümü" }, ...STATUSES.map((s) => ({ key: s.key, label: s.label }))];
  const qs = (extra: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    if (isArchived) p.set("archived", "1");
    if (status) p.set("status", status);
    if (search) p.set("q", search);
    for (const [k, v] of Object.entries(extra)) {
      if (v === undefined || v === "") p.delete(k);
      else p.set(k, String(v));
    }
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div>
      <PageHeader title="İletişim Talepleri" description={`${total} kayıt`} />

      <ViewToolbar basePath="/admin/messages" params={{ view: viewRaw, archived: archivedRaw, status, q: search || undefined }} right={<>{searchForm}{csvLink}</>} />

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/admin/messages${qs({ status: tab.key || undefined, page: undefined })}`}
            className={`rounded-md border px-3.5 py-1.5 text-xs font-medium ${
              (status ?? "") === tab.key ? "border-forest bg-forest text-ivory" : "border-sand bg-white text-stone hover:border-forest/40"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {messages.length === 0 ? (
        <EmptyState text={isArchived ? "Arşivde talep yok." : "Bu filtrede talep bulunmuyor."} />
      ) : (
        <>
          {/* Bulk bar — checkboxes in the table associate with this form via form="msg-bulk" */}
          <form id="msg-bulk" action={bulkMessageAction} className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-sand bg-white px-4 py-2.5 text-xs">
            <label className="flex items-center gap-2 text-stone">
              <SelectAll /> Seç
            </label>
            <span className="text-stone/40">|</span>
            <span className="text-stone">Seçili:</span>
            {isArchived ? (
              <button name="op" value="restore" className="rounded border border-sand px-2.5 py-1 hover:border-forest/40">Arşivden çıkar</button>
            ) : (
              <>
                <button name="op" value="read" className="rounded border border-sand px-2.5 py-1 hover:border-forest/40">Okundu</button>
                <button name="op" value="replied" className="rounded border border-sand px-2.5 py-1 hover:border-forest/40">Yanıtlandı</button>
                <button name="op" value="archive" className="rounded border border-sand px-2.5 py-1 hover:border-forest/40">Arşivle</button>
              </>
            )}
            <button name="op" value="delete" className="rounded border border-red-200 px-2.5 py-1 text-red-600 hover:bg-red-50">Sil</button>
          </form>

          <div className={tableWrap}>
            <table className="w-full text-sm">
              <tbody>
                {messages.map((m) => (
                  <tr key={m.id} className={`border-b border-sand last:border-0 hover:bg-ivory/50 ${m.status === "new" && !isArchived ? "bg-gold/[0.04]" : ""}`}>
                    <td className="w-10 px-4 py-3.5">
                      <input type="checkbox" name="ids" value={m.id} form="msg-bulk" className="h-4 w-4 accent-forest" aria-label={`${m.name} seç`} />
                    </td>
                    <td className="px-3 py-3.5">
                      <Link href={detailHref(m.id)} className="block">
                        <span className={`${m.status === "new" ? "font-semibold" : "font-medium"} text-ink`}>{m.name}</span>
                        <span className="block text-xs text-stone">{m.email}</span>
                      </Link>
                    </td>
                    <td className="hidden px-3 py-3.5 text-stone md:table-cell">{m.service || "—"}</td>
                    <td className="hidden px-3 py-3.5 text-xs text-stone sm:table-cell">{new Date(m.createdAt).toLocaleDateString("tr-TR")}</td>
                    <td className="px-3 py-3.5">
                      <StatusBadge status={m.status} label={statusLabels[m.status] ?? m.status} />
                    </td>
                    <td className="px-3 py-3.5">{rowActions(m)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <Link href={`/admin/messages${qs({ page: currentPage - 1 })}`} aria-disabled={currentPage === 1} className={`rounded-md border border-sand px-3 py-1.5 ${currentPage === 1 ? "pointer-events-none opacity-40" : "hover:border-forest/40"}`}>
            ← Önceki
          </Link>
          <span className="text-stone">{currentPage} / {pageCount}</span>
          <Link href={`/admin/messages${qs({ page: currentPage + 1 })}`} aria-disabled={currentPage === pageCount} className={`rounded-md border border-sand px-3 py-1.5 ${currentPage === pageCount ? "pointer-events-none opacity-40" : "hover:border-forest/40"}`}>
            Sonraki →
          </Link>
        </div>
      )}
    </div>
  );
}
