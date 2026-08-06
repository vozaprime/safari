import Link from "next/link";
import { prisma } from "@/lib/db";
import { getVerifiedSession } from "@/lib/auth";
import { PageHeader, StatCard, AdminCard, StatusBadge, EmptyState } from "@/components/admin/ui";
import AdminIcon from "@/components/admin/icons";
import MiniBarChart from "@/components/admin/MiniBarChart";

const statusLabels: Record<string, string> = { new: "Yeni", read: "Okundu", replied: "Yanıtlandı" };
const actionLabels: Record<string, string> = {
  create: "oluşturdu",
  update: "güncelledi",
  delete: "sildi",
  login: "giriş yaptı",
  logout: "çıkış yaptı",
  reset_password: "şifre sıfırladı",
  change_password: "şifre değiştirdi",
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

export default async function DashboardPage() {
  const session = await getVerifiedSession();
  const isAdmin = session?.role === "admin";
  const since = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
  since.setHours(0, 0, 0, 0);

  const [messageCount, newCount, serviceCount, referenceCount, userCount, latest, recentMsgs, activity, byService] =
    await Promise.all([
      prisma.contactMessage.count(),
      prisma.contactMessage.count({ where: { status: "new" } }),
      prisma.service.count(),
      prisma.reference.count(),
      prisma.user.count(),
      prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.contactMessage.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      isAdmin ? prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 6 }) : Promise.resolve([]),
      prisma.contactMessage.groupBy({ by: ["service"], _count: { _all: true } }),
    ]);

  // 30-day buckets
  const days: { label: string; value: number }[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    days.push({ label: `${d.getDate()}.${d.getMonth() + 1}`, value: 0 });
  }
  for (const m of recentMsgs) {
    const idx = Math.floor((new Date(m.createdAt).getTime() - since.getTime()) / (24 * 60 * 60 * 1000));
    if (idx >= 0 && idx < 30) days[idx].value++;
  }

  const dist = byService
    .filter((b) => b.service)
    .map((b) => ({ service: b.service, count: b._count._all }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const distMax = Math.max(1, ...dist.map((d) => d.count));

  const stats = [
    { label: "Yeni talep", value: newCount, icon: "inbox", href: "/admin/messages?status=new", accent: newCount > 0 },
    { label: "Toplam talep", value: messageCount, icon: "mail", href: "/admin/messages" },
    { label: "Hizmet", value: serviceCount, icon: "grid", href: "/admin/services" },
    { label: "Referans", value: referenceCount, icon: "star", href: "/admin/references" },
  ];

  return (
    <div>
      <PageHeader title="Genel Bakış" description={`Hoş geldiniz, ${session?.name ?? ""}.`} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <AdminCard title="Son 30 gün — talepler" description={`Toplam ${recentMsgs.length} talep`}>
          <div className="mt-5">
            <MiniBarChart data={days} />
          </div>
        </AdminCard>

        <AdminCard title="Hizmete göre dağılım">
          {dist.length === 0 ? (
            <p className="mt-4 text-sm text-stone">Henüz veri yok.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {dist.map((d) => (
                <li key={d.service}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate text-ink">{d.service}</span>
                    <span className="text-stone">{d.count}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded bg-ivory">
                    <div className="h-full rounded bg-gold" style={{ width: `${(d.count / distMax) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-stone">Son talepler</h2>
            <Link href="/admin/messages" className="text-xs text-gold-dark hover:underline">
              Tümü →
            </Link>
          </div>
          {latest.length === 0 ? (
            <EmptyState text="Henüz talep yok." />
          ) : (
            <div className="overflow-hidden rounded-xl border border-sand bg-white">
              <table className="w-full text-sm">
                <tbody>
                  {latest.map((msg) => (
                    <tr key={msg.id} className="border-b border-sand last:border-0 hover:bg-ivory/50">
                      <td className="px-5 py-3.5">
                        <Link href={`/admin/messages/${msg.id}`} className="font-medium text-ink hover:text-forest">
                          {msg.name}
                        </Link>
                      </td>
                      <td className="hidden px-5 py-3.5 text-stone sm:table-cell">{msg.service || "—"}</td>
                      <td className="px-5 py-3.5 text-stone">{new Date(msg.createdAt).toLocaleDateString("tr-TR")}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={msg.status} label={statusLabels[msg.status] ?? msg.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-stone">Hızlı işlemler</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/admin/services", label: "Hizmetler", icon: "grid" },
              { href: "/admin/content", label: "İçerikler", icon: "document" },
              { href: "/admin/references", label: "Referanslar", icon: "star" },
              { href: "/admin/settings", label: "Ayarlar", icon: "settings", adminOnly: true },
            ]
              .filter((q) => !q.adminOnly || isAdmin)
              .map((q) => (
                <Link
                  key={q.href}
                  href={q.href}
                  className="flex flex-col items-center gap-2 rounded-xl border border-sand bg-white py-5 text-xs text-forest transition-all hover:-translate-y-0.5 hover:border-gold/60"
                >
                  <AdminIcon name={q.icon} className="h-5 w-5" />
                  {q.label}
                </Link>
              ))}
          </div>

          {isAdmin && activity.length > 0 && (
            <div className="mt-4">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone">Son aktivite</h2>
              <ul className="space-y-2 rounded-xl border border-sand bg-white p-4 text-xs">
                {activity.map((a) => (
                  <li key={a.id} className="flex items-start gap-2 text-stone">
                    <span className="mt-0.5 text-gold-dark">
                      <AdminIcon name="activity" className="h-3.5 w-3.5" />
                    </span>
                    <span>
                      <span className="text-ink">{a.userEmail}</span> {entityLabels[a.entity] ?? a.entity}{" "}
                      {actionLabels[a.action] ?? a.action}
                      {a.detail ? ` (${a.detail})` : ""} ·{" "}
                      {new Date(a.createdAt).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
