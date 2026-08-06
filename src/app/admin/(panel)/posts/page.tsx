import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader, AdminCard, StatusBadge, inputClass, EmptyState } from "@/components/admin/ui";
import SubmitButton from "@/components/admin/SubmitButton";
import ConfirmButton from "@/components/admin/ConfirmButton";
import AdminIcon from "@/components/admin/icons";
import { createPostAction, deletePostAction } from "../../actions";

export default async function AdminPostsPage() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { translations: { where: { locale: "tr" } } },
  });

  return (
    <div className="max-w-3xl">
      <PageHeader title="Blog / Haberler" description="İçgörü ve haber yazılarını üç dilde yönetin. Yayınlanan yazılar sitede görünür." />

      {posts.length === 0 ? (
        <EmptyState text="Henüz yazı yok. Aşağıdan ilk yazınızı ekleyin." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-sand bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand bg-ivory text-left text-xs uppercase tracking-wider text-stone">
                <th className="px-4 py-3">Başlık</th>
                <th className="hidden px-4 py-3 sm:table-cell">Tarih</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-sand last:border-0 hover:bg-ivory/40">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-3">
                      <span className="grid h-10 w-14 shrink-0 place-items-center overflow-hidden rounded-md border border-sand bg-ivory">
                        {post.cover ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={post.cover} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <AdminIcon name="news" className="h-4 w-4 text-stone/40" />
                        )}
                      </span>
                      <span className="font-medium text-ink">{post.translations[0]?.title ?? post.slug}</span>
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-stone sm:table-cell">
                    {new Date(post.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={post.published ? "replied" : "read"} label={post.published ? "Yayında" : "Taslak"} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/posts/${post.id}`} className="rounded-md border border-sand p-2 text-forest hover:border-gold/60" aria-label="Düzenle">
                        <AdminIcon name="document" className="h-4 w-4" />
                      </Link>
                      <form action={deletePostAction.bind(null, post.id)}>
                        <ConfirmButton confirmText={`"${post.translations[0]?.title ?? post.slug}" yazısını silmek istediğinize emin misiniz?`} className="rounded-md border border-red-200 p-2 text-red-600 hover:bg-red-50" ariaLabel="Sil">
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
      )}

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
    </div>
  );
}
