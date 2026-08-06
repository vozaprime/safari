import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getVerifiedSession } from "@/lib/auth";
import { PageHeader, EmptyState } from "@/components/admin/ui";

const actionLabels: Record<string, string> = {
  create: "oluşturdu",
  update: "güncelledi",
  delete: "sildi",
  login: "giriş yaptı",
  logout: "çıkış yaptı",
  reset_password: "şifre sıfırladı",
  change_password: "şifre değiştirdi",
  reset_request: "sıfırlama istedi",
  reset_complete: "şifre sıfırlamayı tamamladı",
  signout_all: "tüm oturumları kapattı",
};
const entityLabels: Record<string, string> = {
  service: "hizmet",
  reference: "referans",
  content: "içerik",
  settings: "ayarlar",
  message: "talep",
  user: "kullanıcı",
  auth: "oturum",
  post: "yazı",
};
const PAGE_SIZE = 40;

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await getVerifiedSession();
  if (session?.role !== "admin") redirect("/admin");

  const { page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const [total, logs] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="max-w-3xl">
      <PageHeader title="Aktivite Günlüğü" description="Panelde yapılan tüm değişikliklerin kaydı." />

      {logs.length === 0 ? (
        <EmptyState text="Henüz kayıt yok." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-sand bg-white">
          <table className="w-full text-sm">
            <tbody>
              {logs.map((a) => (
                <tr key={a.id} className="border-b border-sand last:border-0">
                  <td className="px-5 py-3 text-xs text-stone">
                    {new Date(a.createdAt).toLocaleString("tr-TR")}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-ink">{a.userEmail || "—"}</span>{" "}
                    <span className="text-stone">
                      {entityLabels[a.entity] ?? a.entity} {actionLabels[a.action] ?? a.action}
                      {a.detail ? ` — ${a.detail}` : ""}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <Link
            href={`/admin/activity?page=${currentPage - 1}`}
            aria-disabled={currentPage === 1}
            className={`rounded-md border border-sand px-3 py-1.5 ${currentPage === 1 ? "pointer-events-none opacity-40" : "hover:border-forest/40"}`}
          >
            ← Önceki
          </Link>
          <span className="text-stone">{currentPage} / {pageCount}</span>
          <Link
            href={`/admin/activity?page=${currentPage + 1}`}
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
