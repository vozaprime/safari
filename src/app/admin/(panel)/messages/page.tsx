import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader, StatusBadge, EmptyState } from "@/components/admin/ui";
import AdminIcon from "@/components/admin/icons";
import SelectAll from "@/components/admin/SelectAll";
import { bulkMessageAction } from "../../actions";
import type { Prisma } from "@prisma/client";

const statusLabels: Record<string, string> = { new: "Yeni", read: "Okundu", replied: "Yanıtlandı" };
const PAGE_SIZE = 15;

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { status, q, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const search = (q ?? "").trim();

  const where: Prisma.ContactMessageWhereInput = {};
  if (status && ["new", "read", "replied"].includes(status)) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
      { message: { contains: search, mode: "insensitive" } },
      { service: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, messages] = await Promise.all([
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const tabs = [
    { key: "", label: "Tümü" },
    { key: "new", label: "Yeni" },
    { key: "read", label: "Okundu" },
    { key: "replied", label: "Yanıtlandı" },
  ];
  const qs = (extra: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
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
      <PageHeader title="İletişim Talepleri" description={`${total} kayıt`}>
        <a
          href={`/api/admin/messages/export${status ? `?status=${status}` : ""}`}
          className="inline-flex items-center gap-2 rounded-md border border-sand px-3.5 py-2 text-xs font-medium text-forest hover:border-gold/60"
        >
          <AdminIcon name="download" className="h-4 w-4" /> CSV indir
        </a>
      </PageHeader>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={`/admin/messages${tab.key ? `?status=${tab.key}` : ""}`}
              className={`rounded-md border px-3.5 py-1.5 text-xs font-medium ${
                (status ?? "") === tab.key
                  ? "border-forest bg-forest text-ivory"
                  : "border-sand bg-white text-stone hover:border-forest/40"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
        <form method="get" className="flex items-center gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone/50">
              <AdminIcon name="search" className="h-4 w-4" />
            </span>
            <input
              name="q"
              defaultValue={search}
              placeholder="Ara..."
              className="w-52 rounded-md border border-sand bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-gold"
            />
          </div>
        </form>
      </div>

      {messages.length === 0 ? (
        <div className="mt-5">
          <EmptyState text="Bu filtrede talep bulunmuyor." />
        </div>
      ) : (
        <form action={bulkMessageAction} className="mt-4">
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-sand bg-white px-4 py-2.5 text-xs">
            <label className="flex items-center gap-2 text-stone">
              <SelectAll /> Seç
            </label>
            <span className="text-stone/40">|</span>
            <span className="text-stone">Seçili işlemler:</span>
            <button name="op" value="read" className="rounded border border-sand px-2.5 py-1 hover:border-forest/40">
              Okundu
            </button>
            <button name="op" value="replied" className="rounded border border-sand px-2.5 py-1 hover:border-forest/40">
              Yanıtlandı
            </button>
            <button name="op" value="delete" className="rounded border border-red-200 px-2.5 py-1 text-red-600 hover:bg-red-50">
              Sil
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-sand bg-white">
            <table className="w-full text-sm">
              <tbody>
                {messages.map((msg) => (
                  <tr
                    key={msg.id}
                    className={`border-b border-sand last:border-0 hover:bg-ivory/50 ${
                      msg.status === "new" ? "bg-gold/[0.04]" : ""
                    }`}
                  >
                    <td className="w-10 px-4 py-3.5">
                      <input type="checkbox" name="ids" value={msg.id} className="h-4 w-4 accent-forest" />
                    </td>
                    <td className="px-3 py-3.5">
                      <Link href={`/admin/messages/${msg.id}`} className="block">
                        <span className={`${msg.status === "new" ? "font-semibold" : "font-medium"} text-ink`}>
                          {msg.name}
                        </span>
                        <span className="block text-xs text-stone">{msg.email}</span>
                      </Link>
                    </td>
                    <td className="hidden px-3 py-3.5 text-stone md:table-cell">{msg.service || "—"}</td>
                    <td className="hidden px-3 py-3.5 text-xs text-stone sm:table-cell">
                      {new Date(msg.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusBadge status={msg.status} label={statusLabels[msg.status] ?? msg.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link href={`/admin/messages/${msg.id}`} className="text-xs text-gold-dark hover:underline">
                        Aç →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </form>
      )}

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <Link
            href={`/admin/messages${qs({ page: currentPage - 1 })}`}
            aria-disabled={currentPage === 1}
            className={`rounded-md border border-sand px-3 py-1.5 ${currentPage === 1 ? "pointer-events-none opacity-40" : "hover:border-forest/40"}`}
          >
            ← Önceki
          </Link>
          <span className="text-stone">
            {currentPage} / {pageCount}
          </span>
          <Link
            href={`/admin/messages${qs({ page: currentPage + 1 })}`}
            aria-disabled={currentPage === pageCount}
            className={`rounded-md border border-sand px-3 py-1.5 ${currentPage === pageCount ? "pointer-events-none opacity-40" : "hover:border-forest/40"}`}
          >
            Sonraki →
          </Link>
        </div>
      )}
    </div>
  );
}
